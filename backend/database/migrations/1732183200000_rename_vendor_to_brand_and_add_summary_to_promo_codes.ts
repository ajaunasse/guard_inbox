import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promo_codes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('vendor', 'brand')
      table.string('summary').nullable().after('brand')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('summary')
      table.renameColumn('brand', 'vendor')
    })
  }
}
