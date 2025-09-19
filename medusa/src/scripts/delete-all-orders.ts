/**
 * Script to delete all orders from Medusa database
 * WARNING: This will permanently delete all order data!
 */

import { execSync } from 'child_process'
import * as dotenv from 'dotenv'
import { Client } from 'pg'

// Load environment variables
dotenv.config({ path: '.env' })

async function deleteAllOrders() {
  console.log('🗑️  Starting order deletion process...')
  console.log('⚠️  WARNING: This will permanently delete ALL orders from the database!')

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables')
    process.exit(1)
  }

  console.log('🔗 Connecting to Neon database...')

  const client = new Client({
    connectionString: databaseUrl,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Start transaction
    await client.query('BEGIN')
    console.log('🔄 Starting transaction...')

    // Delete in correct order to respect foreign key constraints
    const deletionQueries = [
      // First delete line items and related data
      { table: 'line_item_adjustment', name: 'line item adjustments' },
      { table: 'line_item_tax_line', name: 'line item tax lines' },
      { table: 'line_item', name: 'line items' },

      // Delete order related data
      { table: 'order_change', name: 'order changes' },
      { table: 'order_edit', name: 'order edits' },
      { table: 'order_gift_card', name: 'order gift cards' },
      { table: 'order_discount', name: 'order discounts' },

      // Delete payment related data
      { table: 'payment_session', name: 'payment sessions' },
      { table: 'payment', name: 'payments' },
      { table: 'payment_collection', name: 'payment collections' },

      // Delete fulfillment related data
      { table: 'fulfillment_item', name: 'fulfillment items' },
      { table: 'fulfillment', name: 'fulfillments' },

      // Delete return related data
      { table: 'return_item', name: 'return items' },
      { table: 'return', name: 'returns' },

      // Delete claim related data
      { table: 'claim_item', name: 'claim items' },
      { table: 'claim_order', name: 'claim orders' },

      // Delete swap related data
      { table: 'swap', name: 'swaps' },

      // Delete refund
      { table: 'refund', name: 'refunds' },

      // Finally delete orders
      { table: '"order"', name: 'orders' }, // order is a reserved word, so we quote it
    ]

    for (const { table, name } of deletionQueries) {
      try {
        const result = await client.query(`DELETE FROM ${table}`)
        console.log(`✅ Deleted ${result.rowCount || 0} ${name}`)
      } catch (error) {
        // Some tables might not exist or be empty, that's okay
        console.log(`ℹ️  No ${name} to delete or table doesn't exist`)
      }
    }

    // Also clear cart data since incomplete carts can create empty orders
    const cartQueries = [
      { table: 'cart_line_item', name: 'cart line items' },
      { table: 'cart_gift_card', name: 'cart gift cards' },
      { table: 'cart_discount', name: 'cart discounts' },
      { table: 'cart', name: 'carts' },
    ]

    console.log('\n🛒 Also clearing cart data...')
    for (const { table, name } of cartQueries) {
      try {
        const result = await client.query(`DELETE FROM ${table}`)
        console.log(`✅ Deleted ${result.rowCount || 0} ${name}`)
      } catch (error) {
        console.log(`ℹ️  No ${name} to delete or table doesn't exist`)
      }
    }

    // Commit transaction
    await client.query('COMMIT')
    console.log('\n✅ Transaction committed successfully!')

    // Verify deletion
    const orderCount = await client.query('SELECT COUNT(*) FROM "order"')
    const cartCount = await client.query('SELECT COUNT(*) FROM cart')

    console.log('\n📊 Final counts:')
    console.log(`   Orders remaining: ${orderCount.rows[0].count}`)
    console.log(`   Carts remaining: ${cartCount.rows[0].count}`)

    if (orderCount.rows[0].count === '0') {
      console.log('\n🎉 All orders have been successfully deleted!')
    } else {
      console.log('\n⚠️  Some orders may still remain. Please check manually.')
    }

  } catch (error) {
    console.error('\n❌ Error during deletion:', error)

    // Rollback transaction on error
    try {
      await client.query('ROLLBACK')
      console.log('🔄 Transaction rolled back')
    } catch (rollbackError) {
      console.error('❌ Failed to rollback:', rollbackError)
    }

    process.exit(1)
  } finally {
    await client.end()
    console.log('\n👋 Database connection closed')
  }
}

// Run the script
deleteAllOrders().catch(console.error)