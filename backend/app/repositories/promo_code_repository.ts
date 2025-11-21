import PromoCode from '#models/promo_code'
import { DateTime } from 'luxon'

export interface CreatePromoCodeData {
  emailId: number
  code: string | null
  discountRaw: string | null
  brand: string | null
  summary: string | null
  category: string
  url: string | null
  expiresAt: DateTime | null
}

export default class PromoCodeRepository {
  /**
   * Create a new promo code
   */
  async create(data: CreatePromoCodeData): Promise<PromoCode> {
    return PromoCode.create(data)
  }

  /**
   * Find active promo codes for a user
   */
  async findActiveForUser(userId: number, page: number = 1, limit: number = 20) {
    return PromoCode.query()
      .apply((scopes) => scopes.forUser(userId))
      .apply((scopes) => scopes.withCode())
      .apply((scopes) => scopes.active())
      .preload('email')
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)
  }

  /**
   * Find all promo codes with actual code for a user
   */
  async findWithCodeForUser(userId: number, page: number = 1, limit: number = 20) {
    return PromoCode.query()
      .apply((scopes) => scopes.forUser(userId))
      .apply((scopes) => scopes.withCode())
      .preload('email')
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)
  }
}
