import type { ApplicationService } from '@adonisjs/core/types'
import { simpleQueueService } from '#services/simple_queue_service'

export default class SimpleQueueProvider {
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
    simpleQueueService.start()
  }

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    simpleQueueService.stop()
  }
}
