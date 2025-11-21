/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { throttle, throttleRegister, throttleLogin, throttleScans } from '#start/limiter'

const AuthController = () => import('#controllers/auth_controller')
const EmailAccountsController = () => import('#controllers/email_accounts_controller')
const ScansController = () => import('#controllers/scans_controller')
const PromosController = () => import('#controllers/promos_controller')
const EmailsController = () => import('#controllers/emails_controller')
const StatsController = () => import('#controllers/stats_controller')

router
  .group(() => {
    // Auth endpoints with stricter rate limiting
    router.post('auth/register', [AuthController, 'register']).use(throttleRegister)
    router.post('auth/login', [AuthController, 'login']).use(throttleLogin)
    router
      .group(() => {
        router.post('/logout', [AuthController, 'logout']).use(middleware.auth())
        router.get('/me', [AuthController, 'me']).use(middleware.auth())
        router.get('/google/redirect', [AuthController, 'googleRedirect'])
        router.get('/google/callback', [AuthController, 'googleCallback'])
      })
      .prefix('auth')

    router
      .group(() => {
        // Email Accounts
        router.get('email-accounts', [EmailAccountsController, 'index'])
        router.get('email-accounts/connect', [EmailAccountsController, 'connect']) // Get Google OAuth URL
        router.get('email-accounts/callback', [EmailAccountsController, 'callback']) // Handle OAuth code
        router.patch('email-accounts/:id/settings', [EmailAccountsController, 'updateSettings']) // Update settings
        router.delete('email-accounts/:id', [EmailAccountsController, 'destroy'])

        // Scans - Rate limited to prevent abuse
        router.post('scans', [ScansController, 'store']).use(throttleScans) // Start scan
        router.get('scans', [ScansController, 'index']) // List jobs

        // Promos
        router.get('promos', [PromosController, 'index']) // Feed
        router.get('promo-codes', [PromosController, 'codes']) // Vault

        // Emails
        router.get('emails/trash', [EmailsController, 'trash']) // Trash

        // Stats
        router.get('stats', [StatsController, 'index']) // Menu counts
        router.get('stats/dashboard', [StatsController, 'dashboard']) // Dashboard KPIs
      })
      .use(middleware.auth())
      .use(throttle) // General API rate limit
  })
  .prefix('api')
