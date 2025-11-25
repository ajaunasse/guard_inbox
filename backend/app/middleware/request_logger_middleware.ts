import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Request logging middleware
 * Logs all HTTP requests with structured data for monitoring and debugging
 */
export default class RequestLoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = Date.now()
    const { request } = ctx

    // Log incoming request
    const requestData = {
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      ip: request.ip(),
      userAgent: request.header('user-agent'),
      userId: ctx.auth?.user?.id || 'anonymous',
    }

    // Continue to next middleware/handler
    await next()

    // Log response
    const duration = Date.now() - startTime
    const responseData = {
      timestamp: new Date().toISOString(),
      method: request.method(),
      url: request.url(),
      status: ctx.response.getStatus(),
      duration: `${duration}ms`,
      userId: ctx.auth?.user?.id || 'anonymous',
    }

    // Color code based on status
    if (ctx.response.getStatus() >= 500) {
      //console.error('← Response (Server Error):', responseData)
    } else if (ctx.response.getStatus() >= 400) {
      //  console.warn('← Response (Client Error):', responseData)
    } else {
      //  console.log('← Response:', responseData)
    }
  }
}
