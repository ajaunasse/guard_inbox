import User from '#models/user'
import ScanJob from '#models/scan_job'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class ScanJobPolicy extends BasePolicy {
  /**
   * Check if user can view the scan job
   */
  view(user: User, scanJob: ScanJob): AuthorizerResponse {
    return scanJob.userId === user.id
  }

  /**
   * Check if user can view scan jobs (list)
   */
  viewAny(_user: User): AuthorizerResponse {
    return true // Authenticated users can view their own scan jobs
  }

  /**
   * Check if user can create a scan job
   */
  create(_user: User): AuthorizerResponse {
    return true // Authenticated users can create scan jobs
  }

  /**
   * Check if user can delete the scan job
   */
  delete(user: User, scanJob: ScanJob): AuthorizerResponse {
    return scanJob.userId === user.id
  }
}
