import OpenAIService from '#services/openai_service'
import { inject } from '@adonisjs/core'
import { cleanEmailForAI } from '#utils/email_cleaner'

@inject()
export default class PromoExtractionService {
  constructor(protected openaiService: OpenAIService) {}

  /**
   * Extract promo codes and discounts from email content
   */
  async extract(subject: string, snippet: string, body: string | null, sender: string) {
    // Clean and truncate email content to avoid token limits
    const cleaned = cleanEmailForAI(subject, snippet, body || '')
    const textToScan = cleaned.body || cleaned.snippet || ''

    console.log(
      `Cleaned email content: ${textToScan.length} chars (from ${(body || '').length} original)`
    )

    // Use OpenAI to extract details
    const promoDetails = await this.openaiService.extractPromoDetails(
      cleaned.subject,
      sender,
      textToScan
    )

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
