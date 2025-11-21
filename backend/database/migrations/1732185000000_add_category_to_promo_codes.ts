import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promo_codes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('category').defaultTo('Other').notNullable().after('summary')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category')
    })
  }
}
