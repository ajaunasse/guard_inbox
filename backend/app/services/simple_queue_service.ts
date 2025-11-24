import ScanJob from '#models/scan_job'
import EmailAccount from '#models/email_account'
import GmailScanServiceV2 from '#services/gmail_scan_service_v2'
import GmailMessageFetcher from '#services/gmail_message_fetcher'
import GmailOAuthService from '#services/gmail_o_auth_service'
import OpenAIService from '#services/openai_service'
import PromoExtractionService from '#services/promo_extraction_service'
import EmailRepository from '#repositories/email_repository'
import PromoCodeRepository from '#repositories/promo_code_repository'

/**
 * Simple queue service using PostgreSQL without Redis
 * Perfect for low to medium traffic applications
 */
export default class SimpleQueueService {
  private isProcessing = false
  private intervalId: NodeJS.Timeout | null = null

  /**
   * Start the queue processor
   * Polls the database every 5 seconds for pending jobs
   */
  start() {
    if (this.intervalId) {
      console.log('⚠️  Queue processor already running')
      return
    }

    console.log('🚀 Starting simple queue processor...')

    // Process immediately
    this.processQueue()

    // Then poll every 5 seconds
    this.intervalId = setInterval(() => {
      this.processQueue()
    }, 5000)

    console.log('✅ Queue processor started')
  }

  /**
   * Stop the queue processor
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('🛑 Queue processor stopped')
    }
  }

  /**
   * Process pending jobs from the queue
   */
  private async processQueue() {
    // Skip if already processing
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      // Get next pending job
      const job = await ScanJob.query()
        .where('status', 'PENDING')
        .orderBy('created_at', 'asc')
        .first()

      if (!job) {
        // No pending jobs
        this.isProcessing = false
        return
      }

      console.log(`📨 Processing scan job #${job.id}...`)

      // Mark as in progress
      job.status = 'IN_PROGRESS'
      await job.save()

      try {
        // Get email account
        const emailAccount = await EmailAccount.findOrFail(job.emailAccountId)

        // Create scan service with dependencies
        const gmailOAuthService = new GmailOAuthService()
        const gmailMessageFetcher = new GmailMessageFetcher(gmailOAuthService)
        const openaiService = new OpenAIService()
        const promoExtractionService = new PromoExtractionService(openaiService)
        const emailRepository = new EmailRepository()
        const promoCodeRepository = new PromoCodeRepository()

        const scanService = new GmailScanServiceV2(
          gmailMessageFetcher,
          promoExtractionService,
          emailRepository,
          promoCodeRepository
        )

        // Perform the scan
        const emailsScanned = await scanService.scan(emailAccount)

        // Mark as completed
        job.status = 'COMPLETED'
        job.emailsScanned = emailsScanned
        await job.save()

        console.log(`✅ Scan job #${job.id} completed: ${emailsScanned} emails scanned`)
      } catch (error) {
        console.error(`❌ Scan job #${job.id} failed:`, error)

        // Mark as failed
        job.status = 'FAILED'
        job.error = error.message
        await job.save()
      }
    } catch (error) {
      console.error('Error processing queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Add a new job to the queue
   */
  async addJob(scanJobId: number) {
    const job = await ScanJob.findOrFail(scanJobId)
    console.log(`📨 Job #${scanJobId} added to queue`)

    // Trigger immediate processing
    setTimeout(() => this.processQueue(), 100)

    return job
  }

  /**
   * Get queue statistics
   */
  async getStats() {
    const pending = await ScanJob.query().where('status', 'PENDING').count('* as total')
    const inProgress = await ScanJob.query().where('status', 'IN_PROGRESS').count('* as total')
    const completed = await ScanJob.query().where('status', 'COMPLETED').count('* as total')
    const failed = await ScanJob.query().where('status', 'FAILED').count('* as total')

    return {
      pending: pending[0].$extras.total,
      inProgress: inProgress[0].$extras.total,
      completed: completed[0].$extras.total,
      failed: failed[0].$extras.total,
    }
  }
}

// Singleton instance
export const simpleQueueService = new SimpleQueueService()
