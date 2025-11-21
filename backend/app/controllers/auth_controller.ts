import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import GmailOAuthService from '#services/gmail_o_auth_service'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import { registerValidator } from '#validators/register_validator'
import { loginValidator } from '#validators/login_validator'

@inject()
export default class AuthController {
    constructor(protected gmailOAuthService: GmailOAuthService) { }

    async googleRedirect({ response }: HttpContext) {
        const url = this.gmailOAuthService.getLoginUrl()
        return response.redirect(url)
    }

    async googleCallback({ request, response, auth }: HttpContext) {
        const code = request.input('code')

        try {
            const tokens = await this.gmailOAuthService.getTokens(code, env.get('GOOGLE_LOGIN_REDIRECT_URI'))
            const googleUser = await this.gmailOAuthService.getUserInfo(tokens.access_token!)

            if (!googleUser.email) {
                return response.badRequest('No email returned from Google')
            }

            // Find or create user
            let user = await User.findBy('email', googleUser.email)

            if (!user) {
                user = await User.create({
                    email: googleUser.email,
                    fullName: googleUser.name,
                    password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8), // Random password
                })
            }

            // Login user
            await auth.use('web').login(user)

            // Redirect to frontend dashboard
            // In production, this should be an env var for frontend URL
            return response.redirect('http://localhost:5173/dashboard')

        } catch (error) {
            console.error('Google Login Error:', error)
            return response.badRequest('Google Login Failed')
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