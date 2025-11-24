import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

/**
 * Custom exception for OAuth-related errors
 */
export default class OAuthException extends Exception {
  static missingCode() {
    return new this('OAuth authorization code is missing', {
      status: 400,
      code: 'E_OAUTH_MISSING_CODE',
    })
  }

  static tokenExchangeFailed(message: string) {
    return new this(`Failed to exchange OAuth code for tokens: ${message}`, {
      status: 500,
      code: 'E_OAUTH_TOKEN_EXCHANGE',
    })
  }

  static invalidToken() {
    return new this('OAuth token is invalid or expired', {
      status: 401,
      code: 'E_OAUTH_INVALID_TOKEN',
    })
  }

  static userInfoFailed() {
    return new this('Failed to retrieve user information from OAuth provider', {
      status: 500,
      code: 'E_OAUTH_USER_INFO',
    })
  }

  async handle(error: this, ctx: HttpContext) {
    ctx.response.status(error.status).send({
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
      },
    })
  }
}
