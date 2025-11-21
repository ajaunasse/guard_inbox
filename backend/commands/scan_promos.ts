import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import ScanJob from '#models/scan_job'
import GmailScanServiceV2 from '#services/gmail_scan_service_v2'
import app from '@adonisjs/core/services/app'

export default class ScanPromos extends BaseCommand {
  static commandName = 'scan:promos'
  static description = 'Scan pending jobs for promotions'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const gmailScanService = await app.container.make(GmailScanServiceV2)
    this.logger.info('Starting scan job processor...')

    const jobs = await ScanJob.query().where('status', 'PENDING').preload('emailAccount')
    this.logger.info(`Found ${jobs.length} pending jobs`)

    for (const job of jobs) {
      try {
        this.logger.info(`Processing job ${job.id} for account ${job.emailAccountId}`)

        job.status = 'RUNNING'
        await job.save()

        const count = await gmailScanService.scan(job.emailAccount)

        job.status = 'DONE'
        await job.save()

        this.logger.info(`Job ${job.id} completed. Processed ${count} emails.`)

      } catch (error) {
        this.logger.error(`Job ${job.id} failed: ${error.message}`)
        job.status = 'FAILED'
        await job.save()
      }
    }

    this.logger.info('Scan job processor finished.')
  }
}