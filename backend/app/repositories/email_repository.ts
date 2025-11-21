import Email from '#models/email'
import { DateTime } from 'luxon'

export interface CreateEmailData {
  emailAccountId: number
  gmailMessageId: string
  subject: string
  from: string
  to: string
  sentAt: DateTime | null
  snippet: string
  body?: string
  size?: number | null
}

export default class EmailRepository {
  /**
   * Find email by Gmail message ID
   */
  async findByGmailMessageId(gmailMessageId: string): Promise<Email | null> {
    return Email.query().where('gmailMessageId', gmailMessageId).first()
  }

  /**
   * Create a new email
   */
  async create(data: CreateEmailData): Promise<Email> {
    return Email.create(data)
  }

  /**
   * Find emails for a user with promo codes
   */
  async findWithPromoCodesForUser(userId: number, page: number = 1, limit: number = 20) {
    return Email.query()
      .apply((scopes) => scopes.forUser(userId))
      .apply((scopes) => scopes.withPromoCodes())
      .apply((scopes) => scopes.withRelations())
      .orderBy('sentAt', 'desc')
      .paginate(page, limit)
  }

  /**
   * Find emails without promo codes for a user (trash)
   */
  async findWithoutPromoCodesForUser(userId: number, page: number = 1, limit: number = 50) {
    return Email.query()
      .apply((scopes) => scopes.forUser(userId))
      .apply((scopes) => scopes.withoutPromoCodes())
      .orderBy('sentAt', 'desc')
      .paginate(page, limit)
  }
}
