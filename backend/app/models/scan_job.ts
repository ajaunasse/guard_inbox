import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import EmailAccount from '#models/email_account'

export default class ScanJob extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare emailAccountId: number

  @column()
  declare status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

  @column()
  declare emailsScanned: number | null

  @column()
  declare error: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => EmailAccount)
  declare emailAccount: BelongsTo<typeof EmailAccount>
}
