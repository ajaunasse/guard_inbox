import User from '#models/user'
import Email from '#models/email'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class EmailPolicy extends BasePolicy {
  /**
   * Check if user can view the email
   */
  view(user: User, email: Email): AuthorizerResponse {
    return email.emailAccount.userId === user.id
  }

  /**
   * Check if user can view emails (list)
   */
  viewAny(_user: User): AuthorizerResponse {
    return true // Authenticated users can view their own emails
  }

  /**
   * Check if user can delete the email
   */
  delete(user: User, email: Email): AuthorizerResponse {
    return email.emailAccount.userId === user.id
  }
}
