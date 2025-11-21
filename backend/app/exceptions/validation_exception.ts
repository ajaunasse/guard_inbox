import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

/**
 * Custom exception for input validation errors
 */
export default class ValidationException extends Exception {
  static invalidEmailAccountId() {
    return new this('Invalid email account ID', {
      status: 400,
      code: 'E_INVALID_EMAIL_ACCOUNT_ID',
    })
  }

  static invalidQueryParams(field: string) {
    return new this(`Invalid query parameter: ${field}`, {
      status: 400,
      code: 'E_INVALID_QUERY_PARAMS',
    })
  }

  static missingRequiredField(field: string) {
    return new this(`Missing required field: ${field}`, {
      status: 400,
      code: 'E_MISSING_REQUIRED_FIELD',
    })
  }

  static invalidDateFormat(field: string) {
    return new this(`Invalid date format for field: ${field}`, {
      status: 400,
      code: 'E_INVALID_DATE_FORMAT',
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
