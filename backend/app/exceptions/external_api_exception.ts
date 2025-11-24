import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

/**
 * Custom exception for external API errors (Gmail, OpenAI, etc.)
 */
export default class ExternalApiException extends Exception {
  static gmailApiFailed(message: string) {
    return new this(`Gmail API error: ${message}`, {
      status: 502,
      code: 'E_GMAIL_API_ERROR',
    })
  }

  static openaiApiFailed(message: string) {
    return new this(`OpenAI API error: ${message}`, {
      status: 502,
      code: 'E_OPENAI_API_ERROR',
    })
  }

  static openaiTimeout() {
    return new this('OpenAI API request timed out', {
      status: 504,
      code: 'E_OPENAI_TIMEOUT',
    })
  }

  static rateLimitExceeded(service: string, retryAfter?: number) {
    const message = retryAfter
      ? `${service} rate limit exceeded. Retry after ${retryAfter} seconds`
      : `${service} rate limit exceeded`

    return new this(message, {
      status: 429,
      code: 'E_RATE_LIMIT_EXCEEDED',
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
