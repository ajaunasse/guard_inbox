import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

/**
 * Custom exception for business logic errors
 */
export default class BusinessException extends Exception {
  static emailAccountNotFound() {
    return new this('Email account not found or does not belong to user', {
      status: 404,
      code: 'E_EMAIL_ACCOUNT_NOT_FOUND',
    })
  }

  static scanJobNotFound() {
    return new this('Scan job not found or does not belong to user', {
      status: 404,
      code: 'E_SCAN_JOB_NOT_FOUND',
    })
  }

  static duplicateEmailAccount(email: string) {
    return new this(`Email account ${email} is already connected`, {
      status: 409,
      code: 'E_DUPLICATE_EMAIL_ACCOUNT',
    })
  }

  static maxEmailAccountsReached(max: number) {
    return new this(`Maximum number of email accounts (${max}) reached`, {
      status: 400,
      code: 'E_MAX_EMAIL_ACCOUNTS',
    })
  }

  static scanAlreadyInProgress() {
    return new this('A scan is already in progress for this account', {
      status: 409,
      code: 'E_SCAN_IN_PROGRESS',
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
