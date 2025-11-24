import { google } from 'googleapis'
import EmailAccount from '#models/email_account'
import Email from '#models/email'
import PromoCode from '#models/promo_code'
import GmailOAuthService from '#services/gmail_o_auth_service'
import PromoExtractionService from '#services/promo_extraction_service'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'

@inject()
export default class GmailScanService {
  constructor(
    protected gmailOAuthService: GmailOAuthService,
    protected promoExtractionService: PromoExtractionService
  ) { }

  /**
   * Scan recent emails for promotions
   */
  async scan(emailAccount: EmailAccount) {
    // Check if token is expired and refresh if needed
    if (this.gmailOAuthService.isTokenExpired(emailAccount.tokenExpiry?.toJSDate() || null)) {
      console.log(`Access token expired for account ${emailAccount.id}, refreshing...`)

      if (!emailAccount.refreshToken) {
        console.error(`No refresh token available for account ${emailAccount.id}`)
        throw new Error('OAuth token expired and no refresh token available. Please reconnect your account.')
      }

      const { accessToken, expiryDate } = await this.gmailOAuthService.refreshAccessToken(
        emailAccount.refreshToken
      )

      // Update email account with new token
      emailAccount.accessToken = accessToken
      if (expiryDate) {
        emailAccount.tokenExpiry = DateTime.fromMillis(expiryDate)
      }
      await emailAccount.save()

      console.log(`Access token refreshed for account ${emailAccount.id}`)
    }

    const auth = this.gmailOAuthService.getClient(
      emailAccount.accessToken,
      emailAccount.refreshToken
    )

    const gmail = google.gmail({ version: 'v1', auth })

    // 1. List messages (max 50 for MVP to avoid rate limits/timeouts)
    // Filter for category:promotions if possible, or just scan inbox
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 50,
      q: 'category:promotions newer_than:30d', // Scan last 30 days of promos
    })

    const messages = res.data.messages || []
    console.log(`Found ${messages.length} messages to scan for account ${emailAccount.id}`)

    let processedCount = 0

    for (const msg of messages) {
      try {
        // Check if already processed
        const existing = await Email.query().where('gmail_message_id', msg.id!).first()
        if (existing) {
          continue
        }

        // 2. Get full message details
        const fullMsg = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        })

        const payload = fullMsg.data.payload
        const headers = payload?.headers || []

        const subject = headers.find(h => h.name === 'Subject')?.value || ''
        const from = headers.find(h => h.name === 'From')?.value || ''
        const to = headers.find(h => h.name === 'To')?.value || ''
        const dateStr = headers.find(h => h.name === 'Date')?.value
        const sentAt = dateStr ? DateTime.fromRFC2822(dateStr) : null
        const snippet = fullMsg.data.snippet || ''

        // Extract body (simplified)
        let body = ''
        if (payload?.body?.data) {
          body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
        } else if (payload?.parts) {
          // Try to find text/plain or text/html
          const part = payload.parts.find(p => p.mimeType === 'text/plain') || payload.parts.find(p => p.mimeType === 'text/html')
          if (part?.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8')
          }
        }

        // 3. Save Email first (all emails, not just promos)
        const email = await Email.create({
          emailAccountId: emailAccount.id,
          gmailMessageId: msg.id!,
          subject,
          from,
          to,
          sentAt,
          snippet,
          metadata: { headers: headers }, // Store raw headers just in case
        })

        // 4. Extract promo details
        const extraction = await this.promoExtractionService.extract(subject, snippet, body, from)

        // 5. Only save promo codes if there's a promo code OR a discount
        const hasPromo = extraction.codes.length > 0 || extraction.discounts.length > 0

        if (hasPromo) {
          // Save Promo Codes
          for (const code of extraction.codes) {
            await PromoCode.create({
              emailId: email.id,
              code,
              brand: extraction.brand,
              summary: extraction.summary,
              category: extraction.category,
              url: extraction.url,
              discountRaw: extraction.discounts[0] || null,
              expiresAt: extraction.expiresAt ? DateTime.fromISO(extraction.expiresAt) : null,
            })
          }

          // If no code but discount found, save it as a deal without code
          if (extraction.codes.length === 0 && extraction.discounts.length > 0) {
            await PromoCode.create({
              emailId: email.id,
              code: null,
              brand: extraction.brand,
              summary: extraction.summary,
              category: extraction.category,
              url: extraction.url,
              discountRaw: extraction.discounts[0],
              expiresAt: extraction.expiresAt ? DateTime.fromISO(extraction.expiresAt) : null,
            })
          }
        } else {
          console.log(`Email ${msg.id} saved to trash - no promo found`)
        }

        processedCount++

      } catch (error) {
        console.error(`Failed to process message ${msg.id}`, error)
      }
    }

    return processedCount
  }
}