/*
|--------------------------------------------------------------------------
| Define HTTP limiters
|--------------------------------------------------------------------------
|
| The "limiter.define" method creates an HTTP middleware to apply rate
| limits on a route or a group of routes. Feel free to define as many
| throttle middleware as needed.
|
*/

import limiter from '@adonisjs/limiter/services/main'

// General API rate limit
export const throttle = limiter.define('global', () => {
  return limiter.allowRequests(100).every('1 minute')
})

// Auth register limit
export const throttleRegister = limiter.define('auth:register', () => {
  return limiter.allowRequests(5).every('15 minutes').blockFor('15 minutes')
})

// Auth login limit
export const throttleLogin = limiter.define('auth:login', () => {
  return limiter.allowRequests(10).every('15 minutes').blockFor('15 minutes')
})

// Scans limit
export const throttleScans = limiter.define('scans', () => {
  return limiter.allowRequests(10).every('1 hour').blockFor('1 hour')
})
