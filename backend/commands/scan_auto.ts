import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import EmailAccount from '#models/email_account'
import ScanJob from '#models/scan_job'
import { addEmailScanJob } from '#services/queue_service'
import { DateTime } from 'luxon'

export default class ScanAuto extends BaseCommand {
  static commandName = 'scan:auto'
  static description = 'Automatically scan email accounts with auto-scan enabled'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🤖 Starting auto-scan job...')

    try {
      // Find all email accounts with auto-scan enabled
      const accounts = await EmailAccount.query().where('autoScanEnabled', true).preload('user')

      this.logger.info(`Found ${accounts.length} accounts with auto-scan enabled`)

      if (accounts.length === 0) {
        this.logger.info('No accounts to scan. Exiting.')
        return
      }

      let jobsCreated = 0

      for (const account of accounts) {
        try {
          // Create scan job
          const scanJob = await ScanJob.create({
            emailAccountId: account.id,
            userId: account.userId,
            status: 'PENDING',
          })

          // Add to queue
          await addEmailScanJob(scanJob.id, account.id)

          // Update last auto-scan timestamp
          account.lastAutoScanAt = DateTime.now()
          await account.save()

          this.logger.info(
            `✅ Created scan job ${scanJob.id} for account ${account.email} (user: ${account.user.email})`
          )
          jobsCreated++
        } catch (error) {
          this.logger.error(
            `❌ Failed to create scan job for account ${account.email}: ${error.message}`
          )
        }
      }

      this.logger.info(`🎉 Auto-scan completed. Created ${jobsCreated} scan jobs.`)
    } finally {
      // Force exit after completing the task
      await this.terminate()
    }
  }
}
