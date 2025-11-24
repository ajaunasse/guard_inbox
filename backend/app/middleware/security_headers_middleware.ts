import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import helmet from 'helmet'

/**
 * Security headers middleware using Helmet
 * Adds various HTTP security headers to protect against common attacks
 */
export default class SecurityHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Create helmet middleware
    const helmetMiddleware = helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for frontend
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      // Strict Transport Security (HSTS)
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      // Prevent clickjacking
      frameguard: {
        action: 'deny',
      },
      // Prevent MIME sniffing
      noSniff: true,
      // XSS Protection (legacy but still useful)
      xssFilter: true,
      // Hide X-Powered-By header
      hidePoweredBy: true,
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    })

    // Convert Express middleware to AdonisJS middleware
    await new Promise<void>((resolve, reject) => {
      helmetMiddleware(ctx.request.request, ctx.response.response, (error?: any) => {
        if (error) reject(error)
        else resolve()
      })
    })

    await next()
  }
}
