import OpenAIService from '#services/openai_service'
import { inject } from '@adonisjs/core'

@inject()
export default class PromoExtractionService {
  constructor(protected openaiService: OpenAIService) { }

  /**
   * Extract promo codes and discounts from email content
   */
  async extract(subject: string, snippet: string, body: string | null, sender: string) {
    const textToScan = body || snippet || ''

    // Use OpenAI to extract details
    const promoDetails = await this.openaiService.extractPromoDetails(subject, sender, textToScan)

    if (!promoDetails) {
      return {
        codes: [],
        discounts: [],
        brand: null,
        summary: null,
        category: 'Other',
        url: null,
        expiresAt: null,
      }
    }

    return {
      codes: promoDetails.code ? [promoDetails.code] : [],
      discounts: promoDetails.discountRaw ? [promoDetails.discountRaw] : [],
      brand: promoDetails.brand,
      summary: promoDetails.summary,
      category: promoDetails.category,
      url: promoDetails.url,
      expiresAt: promoDetails.expiresAt,
    }
  }
}