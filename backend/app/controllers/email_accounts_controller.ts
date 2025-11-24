import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import GmailOAuthService from '#services/gmail_o_auth_service'
import EmailAccount from '#models/email_account'
import EmailAccountPolicy from '#policies/email_account_policy'
import { google } from 'googleapis'
import { DateTime } from 'luxon'
import env from '#start/env'
import OAuthException from '#exceptions/oauth_exception'
import ExternalApiException from '#exceptions/external_api_exception'

@inject()
export default class EmailAccountsController {
  constructor(protected gmailOAuthService: GmailOAuthService) {}

  async index({ auth, response, bouncer }: HttpContext) {
    const user = auth.user!
    await bouncer.with(EmailAccountPolicy).authorize('viewAny')
    await user.load('emailAccounts')
    return response.ok(user.emailAccounts)
  }

  async connect({ response, bouncer }: HttpContext) {
    await bouncer.with(EmailAccountPolicy).authorize('create')
    const url = this.gmailOAuthService.getAuthUrl()
    return response.ok({ url })
  }

  async callback({ request, response, auth }: HttpContext) {
    const { code } = request.only(['code'])

    if (!code) {
      throw OAuthException.missingCode()
    }

    try {
      const tokens = await this.gmailOAuthService.getTokens(code)

      if (!tokens.access_token) {
        throw OAuthException.tokenExchangeFailed('No access token returned')
      }

      // Get user info to identify the account
      const oauth2Client = this.gmailOAuthService.getClient(
        tokens.access_token,
        tokens.refresh_token || null
      )
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })

      let userInfo
      try {
        userInfo = await oauth2.userinfo.get()
      } catch (error) {
        throw ExternalApiException.gmailApiFailed('Failed to fetch user info')
      }

      if (!userInfo.data.id || !userInfo.data.email) {
        throw OAuthException.userInfoFailed()
      }

      const user = auth.user!

      await EmailAccount.updateOrCreate(
        {
          userId: user.id,
          googleUserId: userInfo.data.id,
        },
        {
          provider: 'gmail',
          email: userInfo.data.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          tokenExpiry: tokens.expiry_date ? DateTime.fromMillis(tokens.expiry_date) : undefined,
        }
      )

      const frontendUrl = env.get('FRONTEND_URL')
      return response.redirect(`${frontendUrl}/dashboard`)
    } catch (error) {
      // Re-throw if it's already our custom exception
      if (error instanceof OAuthException || error instanceof ExternalApiException) {
        throw error
      }

      console.error('Email account callback error:', error)
      throw OAuthException.tokenExchangeFailed(error.message || 'Unknown error')
    }
  }

  async destroy({ params, response, auth, bouncer }: HttpContext) {
    const user = auth.user!
    const account = await user.related('emailAccounts').query().where('id', params.id).firstOrFail()
    await bouncer.with(EmailAccountPolicy).authorize('delete', account)
    await account.delete()
    return response.ok({ message: 'Account disconnected' })
  }

  async updateSettings({ params, request, response, auth, bouncer }: HttpContext) {
    const user = auth.user!
    const account = await user.related('emailAccounts').query().where('id', params.id).firstOrFail()
    await bouncer.with(EmailAccountPolicy).authorize('update', account)

    const { autoDeleteEmails, autoScanEnabled } = request.only([
      'autoDeleteEmails',
      'autoScanEnabled',
    ])

    if (autoDeleteEmails !== undefined) {
      account.autoDeleteEmails = autoDeleteEmails
    }

    if (autoScanEnabled !== undefined) {
      account.autoScanEnabled = autoScanEnabled
    }

    await account.save()

    return response.ok({
      message: 'Settings updated',
      account: {
        id: account.id,
        email: account.email,
        autoDeleteEmails: account.autoDeleteEmails,
        autoScanEnabled: account.autoScanEnabled,
      },
    })
  }
}
