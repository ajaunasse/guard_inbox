import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, scope } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Email from '#models/email'

export default class PromoCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare emailId: number

  @column()
  declare code: string | null

  @column()
  declare discountRaw: string | null

  @column()
  declare brand: string | null

  @column()
  declare summary: string | null

  @column()
  declare category: string

  @column()
  declare url: string | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Email)
  declare email: BelongsTo<typeof Email>

  // Query Scopes
  static forUser = scope((query, userId: number) => {
    query.whereHas('email' as any, (emailQuery: any) => {
      emailQuery.whereHas('emailAccount' as any, (accountQuery: any) => {
        accountQuery.where('user_id', userId)
      })
    })
  })

  static withCode = scope((query) => {
    query.whereNotNull('code')
  })

  static active = scope((query) => {
    const now = DateTime.now()
    query.where((q) => {
      q.whereNull('expiresAt').orWhere('expiresAt', '>', now.toSQL())
    })
  })

  static byCategory = scope((query, category: string) => {
    query.where('category', category)
  })
}
