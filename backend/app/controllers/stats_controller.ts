import type { HttpContext } from '@adonisjs/core/http'
import Email from '#models/email'
import PromoCode from '#models/promo_code'

export default class StatsController {
  /**
   * Get counts for sidebar menu items
   */
  async index({ auth, response }: HttpContext) {
    const user = auth.user!

    // Count emails with promo codes (Promo Wall)
    const promosCount = await Email.query()
      .apply((scopes) => scopes.forUser(user.id))
      .apply((scopes) => scopes.withPromoCodes())
      .count('* as total')
      .first()

    // Count promo codes with actual codes (Vault)
    const vaultCount = await PromoCode.query()
      .apply((scopes) => scopes.forUser(user.id))
      .apply((scopes) => scopes.withCode())
      .count('* as total')
      .first()

    // Count emails without promo codes (Trash)
    const trashCount = await Email.query()
      .apply((scopes) => scopes.forUser(user.id))
      .apply((scopes) => scopes.withoutPromoCodes())
      .count('* as total')
      .first()

    return response.json({
      promos: Number(promosCount?.$extras.total || 0),
      vault: Number(vaultCount?.$extras.total || 0),
      trash: Number(trashCount?.$extras.total || 0),
    })
  }
}
