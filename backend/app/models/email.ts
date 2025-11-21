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

  @column()
  declare size: number | null

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
    query.whereHas('emailAccount' as any, (q: any) => {
      q.where('user_id', userId)
    })
  })

  static withPromoCodes = scope((query) => {
    query.has('promoCodes' as any)
  })

  static withoutPromoCodes = scope((query) => {
    query.doesntHave('promoCodes' as any)
  })

  static withRelations = scope((query) => {
    query.preload('promoCodes' as any).preload('emailAccount' as any)
  })
}
