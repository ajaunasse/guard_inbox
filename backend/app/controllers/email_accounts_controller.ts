import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import GmailOAuthService from '#services/gmail_o_auth_service'
import EmailAccount from '#models/email_account'
import EmailAccountPolicy from '#policies/email_account_policy'
import { google } from 'googleapis'
import { DateTime } from 'luxon'

@inject()
export default class EmailAccountsController {
    constructor(protected gmailOAuthService: GmailOAuthService) { }

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
        const tokens = await this.gmailOAuthService.getTokens(code)

        // Get user info to identify the account
        const oauth2Client = this.gmailOAuthService.getClient(tokens.access_token!, tokens.refresh_token!)
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
        const userInfo = await oauth2.userinfo.get()

        const user = auth.user!

        await EmailAccount.updateOrCreate(
            {
                userId: user.id,
                googleUserId: userInfo.data.id!,
            },
            {
                provider: 'gmail',
                email: userInfo.data.email || null,
                accessToken: tokens.access_token!,
                refreshToken: tokens.refresh_token || undefined, // Only update if present
                tokenExpiry: tokens.expiry_date ? DateTime.fromMillis(tokens.expiry_date) : undefined,
            }
        )

        return response.redirect('http://localhost:5173/dashboard')
    }

    async destroy({ params, response, auth, bouncer }: HttpContext) {
        const user = auth.user!
        const account = await user.related('emailAccounts').query().where('id', params.id).firstOrFail()
        await bouncer.with(EmailAccountPolicy).authorize('delete', account)
        await account.delete()
        return response.ok({ message: 'Account disconnected' })
    }
}