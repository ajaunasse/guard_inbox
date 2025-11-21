import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Email from '#models/email'
import ScanJob from '#models/scan_job'
import encryption from '@adonisjs/core/services/encryption'

export default class EmailAccount extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare provider: string

  @column()
  declare googleUserId: string

  @column()
  declare email: string | null

  @column({
    consume: (value: string) => (value ? encryption.decrypt(value) : null),
    prepare: (value: string) => (value ? encryption.encrypt(value) : null),
  })
  declare accessToken: string

  @column({
    consume: (value: string | null) => (value ? encryption.decrypt(value) : null),
    prepare: (value: string | null) => (value ? encryption.encrypt(value) : null),
  })
  declare refreshToken: string | null

  @column.dateTime()
  declare tokenExpiry: DateTime | null

  @column()
  declare autoDeleteEmails: boolean

  @column()
  declare autoScanEnabled: boolean

  @column.dateTime()
  declare lastAutoScanAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Email)
  declare emails: HasMany<typeof Email>

  @hasMany(() => ScanJob)
  declare scanJobs: HasMany<typeof ScanJob>
}
