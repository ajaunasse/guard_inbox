import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  enabled: true,

  // Only allow specific origins from environment variable
  origin: (requestOrigin) => {
    const allowedOrigins = env
      .get('ALLOWED_ORIGINS')
      .split(',')
      .map((o) => o.trim())

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!requestOrigin) {
      return true
    }

    // Check if origin is in allowed list
    return allowedOrigins.includes(requestOrigin)
  },

  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: true,
  exposeHeaders: ['X-Request-Id'],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
