import type { HttpContext } from '@adonisjs/core/http'
import EmailRepository from '#repositories/email_repository'
import PromoCodeRepository from '#repositories/promo_code_repository'
import EmailPolicy from '#policies/email_policy'
import { inject } from '@adonisjs/core'

@inject()
export default class PromosController {
  constructor(
    protected emailRepository: EmailRepository,
    protected promoCodeRepository: PromoCodeRepository
  ) {}

  async index({ auth, request, response, bouncer }: HttpContext) {
    const user = auth.user!
    await bouncer.with(EmailPolicy).authorize('viewAny')

    const page = request.input('page', 1)
    const limit = 20

    // Get emails with promo codes using repository
    const emails = await this.emailRepository.findWithPromoCodesForUser(user.id, page, limit)

    return response.ok(emails)
  }

  async codes({ auth, request, response, bouncer }: HttpContext) {
    const user = auth.user!
    await bouncer.with(EmailPolicy).authorize('viewAny')

    const page = request.input('page', 1)
    const limit = 20

    // Get promo codes using repository
    const codes = await this.promoCodeRepository.findWithCodeForUser(user.id, page, limit)

    return response.ok(codes)
  }
}
