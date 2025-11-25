import type { HttpContext } from '@adonisjs/core/http'
import Email from '#models/email'
import PromoCode from '#models/promo_code'
import { DateTime } from 'luxon'

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

  /**
   * Get dashboard statistics
   */
  async dashboard({ auth, response }: HttpContext) {
    const user = auth.user!
    const now = DateTime.now()
    const sevenDaysFromNow = now.plus({ days: 7 })
    const startOfMonth = now.startOf('month')

    // Total promo codes (individual codes with actual code string)
    const totalPromoCodesCount = await PromoCode.query()
      .apply((scopes) => scopes.forUser(user.id))
      .apply((scopes) => scopes.withCode())
      .count('* as total')
      .first()

    // Active promo codes (with code and not expired) - same logic as Vault
    const activePromoCodesCount = await PromoCode.query()
      .apply((scopes) => scopes.forUser(user.id))
      .apply((scopes) => scopes.withCode())
      .apply((scopes) => scopes.active())
      .count('* as total')
      .first()

    // Promo codes expiring soon (within 7 days)
    const expiringSoonCount = await PromoCode.query()
      .apply((scopes) => scopes.forUser(user.id))
      .apply((scopes) => scopes.withCode())
      .whereBetween('expiresAt', [now.toSQL()!, sevenDaysFromNow.toSQL()!])
      .count('* as total')
      .first()

    // Promo codes created this month
    const thisMonthCodesCount = await PromoCode.query()
      .apply((scopes) => scopes.forUser(user.id))
      .apply((scopes) => scopes.withCode())
      .where('createdAt', '>=', startOfMonth.toSQL()!)
      .count('* as total')
      .first()

    // Total savings (sum of discount percentages as estimate)
    const allPromoCodes = await PromoCode.query()
      .apply((scopes) => scopes.forUser(user.id))
      .select('discountRaw')

    let totalSavings = 0
    allPromoCodes.forEach((promo) => {
      if (promo.discountRaw) {
        const match = promo.discountRaw.match(/(\d+)/)
        if (match) {
          totalSavings += Number.parseInt(match[1], 10)
        }
      }
    })

    // Total emails scanned
    const emailsScannedCount = await Email.query()
      .apply((scopes) => scopes.forUser(user.id))
      .count('* as total')
      .first()

    // Storage saved (sum of actual email sizes)
    const emailsCount = Number(emailsScannedCount?.$extras.total || 0)
    const totalSizeResult = await Email.query()
      .apply((scopes) => scopes.forUser(user.id))
      .sum('size as total')
      .first()

    const totalSizeBytes = Number(totalSizeResult?.$extras.total || 0)
    const storageSaved = Math.round(totalSizeBytes / (1024 * 1024)) // Convert bytes to MB

    return response.json({
      totalPromoCodes: Number(totalPromoCodesCount?.$extras.total || 0),
      activePromoCodes: Number(activePromoCodesCount?.$extras.total || 0),
      totalSavings,
      emailsScanned: emailsCount,
      storageSaved,
      thisMonthCodes: Number(thisMonthCodesCount?.$extras.total || 0),
      expiringSoon: Number(expiringSoonCount?.$extras.total || 0),
    })
  }
}
