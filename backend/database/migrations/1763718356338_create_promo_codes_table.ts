import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promo_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('email_id').unsigned().references('id').inTable('emails').onDelete('CASCADE')
      table.string('code').nullable()
      table.string('discount_raw').nullable()
      table.string('vendor').nullable()
      table.timestamp('expires_at').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}