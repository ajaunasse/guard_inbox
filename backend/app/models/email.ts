import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import EmailAccount from '#models/email_account'
import PromoCode from '#models/promo_code'

export default class Email extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare emailAccountId: number

  @column()
  declare gmailMessageId: string

  @column()
  declare subject: string | null

  @column()
  declare from: string | null

  @column()
  declare to: string | null

  @column.dateTime()
  declare sentAt: DateTime | null

  @column()
  declare snippet: string | null

  @column()
  declare body: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => EmailAccount)
  declare emailAccount: BelongsTo<typeof EmailAccount>

  @hasMany(() => PromoCode)
  declare promoCodes: HasMany<typeof PromoCode>

  // Query Scopes
  static forUser = scope((query, userId: number) => {
    query.whereHas('emailAccount', (q) => {
      q.where('userId', userId)
    })
  })

  static withPromoCodes = scope((query) => {
    query.whereHas('promoCodes')
  })

  static withoutPromoCodes = scope((query) => {
    query.whereDoesntHave('promoCodes')
  })

  static withRelations = scope((query) => {
    query.preload('promoCodes').preload('emailAccount')
  })
}