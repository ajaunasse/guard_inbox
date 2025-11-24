import type { HttpContext } from '@adonisjs/core/http'
import EmailRepository from '#repositories/email_repository'
import EmailPolicy from '#policies/email_policy'
import { inject } from '@adonisjs/core'

@inject()
export default class EmailsController {
  constructor(protected emailRepository: EmailRepository) {}

  async trash({ auth, request, response, bouncer }: HttpContext) {
    const user = auth.user!
    await bouncer.with(EmailPolicy).authorize('viewAny')

    const page = request.input('page', 1)
    const limit = 50

    // Get emails without promo codes using repository
    const emails = await this.emailRepository.findWithoutPromoCodesForUser(user.id, page, limit)

    return response.ok(emails)
  }
}
