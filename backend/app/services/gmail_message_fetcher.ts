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
}

@inject()
export default class GmailMessageFetcher {
  constructor(protected gmailOAuthService: GmailOAuthService) {}

  /**
   * Fetch messages from Gmail for a given account
   */
  async fetchMessages(accessToken: string, refreshToken: string | null, maxResults: number = 50): Promise<{ id: string }[]> {
    const auth = this.gmailOAuthService.getClient(accessToken, refreshToken || undefined)
    const gmail = google.gmail({ version: 'v1', auth })

    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'category:promotions newer_than:30d',
    })

    return res.data.messages || []
  }

  /**
   * Get full message details from Gmail
   */
  async getMessage(accessToken: string, refreshToken: string | null, messageId: string): Promise<GmailMessage | null> {
    const auth = this.gmailOAuthService.getClient(accessToken, refreshToken || undefined)
    const gmail = google.gmail({ version: 'v1', auth })

    const fullMsg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    })

    const payload = fullMsg.data.payload
    const headers = payload?.headers || []

    const subject = headers.find((h) => h.name === 'Subject')?.value || ''
    const from = headers.find((h) => h.name === 'From')?.value || ''
    const to = headers.find((h) => h.name === 'To')?.value || ''
    const dateStr = headers.find((h) => h.name === 'Date')?.value
    const snippet = fullMsg.data.snippet || ''

    // Extract body
    let body = ''
    if (payload?.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    } else if (payload?.parts) {
      const part = payload.parts.find((p) => p.mimeType === 'text/plain') || payload.parts.find((p) => p.mimeType === 'text/html')
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
    }
  }
}
