import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import GmailOAuthService from '#services/gmail_o_auth_service'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import { registerValidator } from '#validators/register_validator'
import { loginValidator } from '#validators/login_validator'
import { randomBytes } from 'node:crypto'
import OAuthException from '#exceptions/oauth_exception'

@inject()
export default class AuthController {
  constructor(protected gmailOAuthService: GmailOAuthService) {}

  async googleRedirect({ response }: HttpContext) {
    const url = this.gmailOAuthService.getLoginUrl()
    return response.redirect(url)
  }

  async googleCallback({ request, response, auth }: HttpContext) {
    const code = request.input('code')

    if (!code) {
      throw OAuthException.missingCode()
    }

    try {
      const tokens = await this.gmailOAuthService.getTokens(
        code,
        env.get('GOOGLE_LOGIN_REDIRECT_URI')
      )

      if (!tokens.access_token) {
        throw OAuthException.tokenExchangeFailed('No access token returned')
      }

      const googleUser = await this.gmailOAuthService.getUserInfo(tokens.access_token)

      if (!googleUser.email) {
        throw OAuthException.userInfoFailed()
      }

      // Find or create user
      let user = await User.findBy('email', googleUser.email)

      if (!user) {
        // Generate cryptographically secure random password
        const randomPassword = randomBytes(32).toString('hex')

        user = await User.create({
          email: googleUser.email,
          fullName: googleUser.name,
          password: randomPassword,
        })
      }

      // Login user
      await auth.use('web').login(user)

      // Redirect to frontend dashboard
      const frontendUrl = env.get('FRONTEND_URL')
      return response.redirect(`${frontendUrl}/dashboard`)
    } catch (error) {
      // Re-throw if it's already our custom exception
      if (error instanceof OAuthException) {
        throw error
      }

      console.error('Google Login Error:', error)
      throw OAuthException.tokenExchangeFailed(error.message || 'Unknown error')
    }
  }

  async register({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(registerValidator)
    const user = await User.create(data)

    await auth.use('web').login(user)

    return response.created(user)
  }

  async login({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(loginValidator)
    const user = await User.verifyCredentials(data.email, data.password)

    if (!user) {
      return response.unauthorized({ message: 'Invalid credentials' })
    }

    await auth.use('web').login(user)

    return response.ok(user)
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.ok({ message: 'Logged out' })
  }

  async me({ auth, response }: HttpContext) {
    await auth.check()
    return response.ok(auth.user)
  }
}
