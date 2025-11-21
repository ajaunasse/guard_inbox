import vine from '@vinejs/vine'

/**
 * Validator for creating a scan job
 */
export const createScanValidator = vine.compile(
  vine.object({
    emailAccountId: vine.number().positive().withoutDecimals(),
  })
)
