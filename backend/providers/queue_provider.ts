import type { ApplicationService } from '@adonisjs/core/types'
import { startEmailScanWorker, stopEmailScanWorker } from '#services/queue_service'

export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {}

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {
    console.log('🚀 Starting queue workers...')
    startEmailScanWorker()
  }

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    console.log('🛑 Stopping queue workers...')
    stopEmailScanWorker()
  }
}
