import { google } from 'googleapis'
import GmailOAuthService from '#services/gmail_o_auth_service'
import { inject } from '@adonisjs/core'

export interface GmailMessage {
  id: string
  subject: string
  from: string
  to: string
  sentAt: string | null
  snippet: string
  body: string
  size: number | null
}

@inject()
export default class GmailMessageFetcher {
  constructor(protected gmailOAuthService: GmailOAuthService) {}

  /**
   * Fetch messages from Gmail for a given account
   */
  async fetchMessages(
    accessToken: string,
    refreshToken: string | null,
    maxResults: number = 50
  ): Promise<{ id: string }[]> {
    const auth = this.gmailOAuthService.getClient(accessToken, refreshToken ?? undefined)
    const gmail = google.gmail({ version: 'v1', auth })

    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'category:promotions newer_than:90d',
    })

    const messages = res.data.messages || []
    return messages.filter((m): m is { id: string } => !!m.id)
  }

  /**
   * Get full message details from Gmail
   */
  async getMessage(
    accessToken: string,
    refreshToken: string | null,
    messageId: string
  ): Promise<GmailMessage | null> {
    const auth = this.gmailOAuthService.getClient(accessToken, refreshToken ?? undefined)
    const gmail = google.gmail({ version: 'v1', auth })

    const fullMsg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })
    console.log('FULL MESSAGE', fullMsg)

    const payload = fullMsg.data.payload
    const headers = payload?.headers || []

    const subject = headers.find((h) => h.name === 'Subject')?.value || ''
    const from = headers.find((h) => h.name === 'From')?.value || ''
    const to = headers.find((h) => h.name === 'To')?.value || ''
    const dateStr = headers.find((h) => h.name === 'Date')?.value
    const snippet = fullMsg.data.snippet || ''
    const size = fullMsg.data.sizeEstimate ?? null

    console.log(`[GMAIL FETCH] Message ${messageId}: sizeEstimate = ${fullMsg.data.sizeEstimate}`)

    let body = ''
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    } else if (payload?.parts) {
      const part =
        payload.parts.find((p) => p.mimeType === 'text/plain') ||
        payload.parts.find((p) => p.mimeType === 'text/html')
      if (part?.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
    }

    return {
      id: messageId,
      subject,
      from,
      to,
      sentAt: dateStr || null,
      snippet,
      body,
      size,
    }
  }

  /**
   * Move message to trash (soft delete)
   */
  async trashMessage(
    accessToken: string,
    refreshToken: string | null,
    messageId: string
  ): Promise<boolean> {
    try {
      const auth = this.gmailOAuthService.getClient(accessToken, refreshToken ?? undefined)
      const gmail = google.gmail({ version: 'v1', auth })

      await gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      })

      console.log(`✅ Message ${messageId} moved to trash`)
      return true
    } catch (error) {
      console.error(`Failed to trash message ${messageId}:`, error)
      return false
    }
  }

  /**
   * Batch trash multiple messages (more efficient)
   */
  async batchTrashMessages(
    accessToken: string,
    refreshToken: string | null,
    messageIds: string[]
  ): Promise<number> {
    if (messageIds.length === 0) return 0

    const auth = this.gmailOAuthService.getClient(accessToken, refreshToken ?? undefined)
    const gmail = google.gmail({ version: 'v1', auth })

    let trashedCount = 0

    // Gmail API doesn't have a batch trash endpoint, so we do it in parallel
    const promises = messageIds.map(async (messageId) => {
      try {
        await gmail.users.messages.trash({
          userId: 'me',
          id: messageId,
        })
        trashedCount++
        return true
      } catch (error) {
        console.error(`Failed to trash message ${messageId}:`, error)
        return false
      }
    })

    await Promise.all(promises)

    console.log(`✅ Trashed ${trashedCount}/${messageIds.length} messages`)
    return trashedCount
  }
}
