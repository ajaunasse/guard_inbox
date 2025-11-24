import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('auto_delete_emails').defaultTo(false).notNullable()
      table.boolean('auto_scan_enabled').defaultTo(false).notNullable()
      table.timestamp('last_auto_scan_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('auto_delete_emails')
      table.dropColumn('auto_scan_enabled')
      table.dropColumn('last_auto_scan_at')
    })
  }
}
