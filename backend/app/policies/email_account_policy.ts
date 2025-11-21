import User from '#models/user'
import EmailAccount from '#models/email_account'
import { BasePolicy } from '@adonisjs/bouncer'
import { AuthorizerResponse } from '@adonisjs/bouncer/types'

export default class EmailAccountPolicy extends BasePolicy {
  /**
   * Check if user can view the email account
   */
  view(user: User, emailAccount: EmailAccount): AuthorizerResponse {
    return emailAccount.userId === user.id
  }

  /**
   * Check if user can view email accounts (list)
   */
  viewAny(_user: User): AuthorizerResponse {
    return true // Authenticated users can view their own accounts
  }

  /**
   * Check if user can create an email account
   */
  create(_user: User): AuthorizerResponse {
    return true // Authenticated users can connect email accounts
  }

  /**
   * Check if user can update the email account
   */
  update(user: User, emailAccount: EmailAccount): AuthorizerResponse {
    return emailAccount.userId === user.id
  }

  /**
   * Check if user can delete the email account
   */
  delete(user: User, emailAccount: EmailAccount): AuthorizerResponse {
    return emailAccount.userId === user.id
  }

  /**
   * Check if user can scan the email account
   */
  scan(user: User, emailAccount: EmailAccount): AuthorizerResponse {
    return emailAccount.userId === user.id
  }
}
