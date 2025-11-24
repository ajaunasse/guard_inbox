import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Users table
    this.schema.createTable('users', (table) => {
      table.increments('id').primary()
      table.string('full_name').nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    // Email accounts table
    this.schema.createTable('email_accounts', (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('provider').notNullable().defaultTo('gmail')
      table.string('google_user_id').notNullable()
      table.string('email').nullable()
      table.text('access_token').notNullable()
      table.text('refresh_token').nullable()
      table.timestamp('token_expiry').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['user_id', 'google_user_id'])
    })

    // Emails table
    this.schema.createTable('emails', (table) => {
      table.increments('id').primary()
      table
        .integer('email_account_id')
        .unsigned()
        .references('id')
        .inTable('email_accounts')
        .onDelete('CASCADE')
      table.string('gmail_message_id').notNullable().unique()
      table.string('subject').notNullable()
      table.string('from').notNullable()
      table.string('to').notNullable()
      table.timestamp('sent_at').notNullable()
      table.text('snippet').nullable()
      table.text('body').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    // Promo codes table
    this.schema.createTable('promo_codes', (table) => {
      table.increments('id').primary()
      table.integer('email_id').unsigned().references('id').inTable('emails').onDelete('CASCADE')
      table.string('code').nullable()
      table.string('brand').nullable()
      table.text('url').nullable()
      table.string('category').nullable()
      table.text('summary').nullable()
      table.string('discount_raw').nullable()
      table.timestamp('expires_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    // Scan jobs table
    this.schema.createTable('scan_jobs', (table) => {
      table.increments('id').primary()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table
        .integer('email_account_id')
        .unsigned()
        .references('id')
        .inTable('email_accounts')
        .onDelete('CASCADE')
      table
        .enum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'])
        .notNullable()
        .defaultTo('PENDING')
      table.integer('emails_scanned').nullable()
      table.text('error').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable('scan_jobs')
    this.schema.dropTable('promo_codes')
    this.schema.dropTable('emails')
    this.schema.dropTable('email_accounts')
    this.schema.dropTable('users')
  }
}
