import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { Exception } from '@adonisjs/core/exceptions'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // If it's our custom exception with a handle method, let it handle itself
    if (error instanceof Exception && typeof (error as any).handle === 'function') {
      return (error as any).handle(error, ctx)
    }

    // Handle Google API errors
    if (this.isGoogleApiError(error)) {
      return ctx.response.status(502).send({
        error: {
          message: 'External API error occurred',
          code: 'E_EXTERNAL_API_ERROR',
          status: 502,
        },
      })
    }

    // Handle OpenAI errors
    if (this.isOpenAIError(error)) {
      return ctx.response.status(502).send({
        error: {
          message: 'AI service error occurred',
          code: 'E_OPENAI_ERROR',
          status: 502,
        },
      })
    }

    // Default handling
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    // Log custom exceptions with structured data
    if (error instanceof Exception) {
      const errorData = {
        code: (error as any).code || 'UNKNOWN',
        message: error.message,
        status: (error as any).status || 500,
        url: ctx.request.url(),
        method: ctx.request.method(),
        user: ctx.auth?.user?.id || 'anonymous',
        timestamp: new Date().toISOString(),
      }

      console.error('Exception occurred:', errorData)
    }

    return super.report(error, ctx)
  }

  /**
   * Check if error is from Google API
   */
  private isGoogleApiError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      ('code' in error || 'errors' in error) &&
      error.constructor.name.includes('Google')
    )
  }

  /**
   * Check if error is from OpenAI
   */
  private isOpenAIError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && error.constructor.name.includes('OpenAI')
  }
}
