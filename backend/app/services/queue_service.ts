import { Queue, Worker, Job } from 'bullmq'
import { Redis } from 'ioredis'
import queueConfig from '#config/queue'
import GmailScanServiceV2 from '#services/gmail_scan_service_v2'
import GmailMessageFetcher from '#services/gmail_message_fetcher'
import GmailOAuthService from '#services/gmail_o_auth_service'
import OpenAIService from '#services/openai_service'
import PromoExtractionService from '#services/promo_extraction_service'
import EmailRepository from '#repositories/email_repository'
import PromoCodeRepository from '#repositories/promo_code_repository'
import EmailAccount from '#models/email_account'
import ScanJob from '#models/scan_job'

// Redis connection (lazy initialization)
let connection: Redis | null = null

function getRedisConnection(): Redis {
  if (!connection) {
    connection = new Redis({
      host: queueConfig.redis.host,
      port: queueConfig.redis.port,
      password: queueConfig.redis.password,
      maxRetriesPerRequest: null,
      // Add retry strategy
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('Redis connection failed after 10 retries')
          return null
        }
        const delay = Math.min(times * 50, 2000)
        console.log(`Retrying Redis connection in ${delay}ms...`)
        return delay
      },
    })

    connection.on('error', (error: Error) => {
      console.error('Redis connection error:', error.message)
    })

    connection.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })
  }
  return connection
}

// Email scan queue (lazy initialization)
let emailScanQueueInstance: Queue | null = null

export function getEmailScanQueue() {
  if (!emailScanQueueInstance) {
    emailScanQueueInstance = new Queue(queueConfig.queues.emailScan.name, {
      connection: getRedisConnection(),
    })
  }
  return emailScanQueueInstance
}

export const emailScanQueue = getEmailScanQueue()

// Job data interface
interface EmailScanJobData {
  scanJobId: number
  emailAccountId: number
}

// Worker to process email scan jobs
let worker: Worker<EmailScanJobData> | null = null

export function startEmailScanWorker() {
  if (worker) {
    console.log('Email scan worker already running')
    return worker
  }

  worker = new Worker<EmailScanJobData>(
    queueConfig.queues.emailScan.name,
    async (job: Job<EmailScanJobData>) => {
      console.log(`Processing scan job ${job.data.scanJobId}...`)

      const { scanJobId, emailAccountId } = job.data

      try {
        // Update scan job status to IN_PROGRESS
        const scanJob = await ScanJob.findOrFail(scanJobId)
        scanJob.status = 'IN_PROGRESS'
        await scanJob.save()

        // Get email account
        const emailAccount = await EmailAccount.findOrFail(emailAccountId)

        // Create service dependencies
        const gmailOAuthService = new GmailOAuthService()
        const gmailMessageFetcher = new GmailMessageFetcher(gmailOAuthService)
        const openaiService = new OpenAIService()
        const promoExtractionService = new PromoExtractionService(openaiService)
        const emailRepository = new EmailRepository()
        const promoCodeRepository = new PromoCodeRepository()

        // Perform the scan
        const scanService = new GmailScanServiceV2(
          gmailMessageFetcher,
          promoExtractionService,
          emailRepository,
          promoCodeRepository
        )
        const emailsScanned = await scanService.scan(emailAccount)

        // Update scan job status to COMPLETED
        scanJob.status = 'COMPLETED'
        scanJob.emailsScanned = emailsScanned
        await scanJob.save()

        console.log(`Scan job ${scanJobId} completed: ${emailsScanned} emails scanned`)

        return { success: true, emailsScanned }
      } catch (error) {
        console.error(`Scan job ${scanJobId} failed:`, error)

        // Update scan job status to FAILED
        const scanJob = await ScanJob.find(scanJobId)
        if (scanJob) {
          scanJob.status = 'FAILED'
          scanJob.error = error.message
          await scanJob.save()
        }

        throw error
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: queueConfig.queues.emailScan.concurrency,
      removeOnComplete: { count: 100 }, // Keep last 100 completed jobs
      removeOnFail: { count: 50 }, // Keep last 50 failed jobs
    }
  )

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message)
  })

  console.log('✅ Email scan worker started')

  return worker
}

export function stopEmailScanWorker() {
  if (worker) {
    worker.close()
    worker = null
    console.log('Email scan worker stopped')
  }
}

// Add a job to the queue
export async function addEmailScanJob(scanJobId: number, emailAccountId: number) {
  const queue = getEmailScanQueue()
  const job = await queue.add(
    'scan',
    {
      scanJobId,
      emailAccountId,
    },
    {
      attempts: queueConfig.queues.emailScan.attempts,
      backoff: queueConfig.queues.emailScan.backoff,
    }
  )

  console.log(`📨 Scan job ${scanJobId} added to queue with ID: ${job.id}`)

  return job
}

// Get queue stats
export async function getQueueStats() {
  const queue = getEmailScanQueue()
  const counts = await queue.getJobCounts()
  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
  }
}
