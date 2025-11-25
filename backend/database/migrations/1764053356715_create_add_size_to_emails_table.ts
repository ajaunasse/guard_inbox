import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'emails'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('size').unsigned().nullable().comment('Email size in bytes')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('size')
    })
  }
}
