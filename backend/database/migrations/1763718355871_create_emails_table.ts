import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'emails'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('email_account_id').unsigned().references('id').inTable('email_accounts').onDelete('CASCADE')
      table.string('gmail_message_id').unique().notNullable()
      table.string('subject').nullable()
      table.string('from').nullable()
      table.text('to').nullable()
      table.timestamp('sent_at').nullable()
      table.text('snippet').nullable()
      table.json('metadata').nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}