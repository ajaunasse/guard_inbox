import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_accounts'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('email').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email')
    })
  }
}