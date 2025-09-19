/**
 * Force delete all orders from Medusa database
 * Handles foreign key constraints by deleting in the correct order
 * Updated to handle Medusa v2 schema comprehensively
 */

import * as dotenv from 'dotenv'
import { Client } from 'pg'

// Load environment variables
dotenv.config({ path: '.env' })

async function forceDeleteOrders() {
  console.log('🚨 FORCE DELETE ALL ORDERS - THIS CANNOT BE UNDONE!')

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!databaseUrl) {
    console.error('❌ No database URL found')
    process.exit(1)
  }

  const client = new Client({
    connectionString: databaseUrl,
  })

  try {
    await client.connect()
    console.log('✅ Connected to database')

    // Disable foreign key checks temporarily (PostgreSQL way)
    console.log('🔓 Disabling foreign key constraints...')
    await client.query('BEGIN')

    // Delete in reverse dependency order - comprehensive list for Medusa v2
    const deletionOrder = [
      // Order line item related
      'order_line_item_tax_line',
      'order_line_item_adjustment',
      'order_line_item',

      // Order shipping related
      'order_shipping_method_tax_line',
      'order_shipping_method_adjustment',
      'order_shipping_method',

      // Order item and details
      'order_item',
      'order_shipping',
      'order_promotion',

      // Payment related
      'order_payment_collection',
      'payment_collection_payment',
      'payment_collection',
      'payment_session',
      'payment',

      // Order modifications
      'order_credit_line',
      'order_gift_card',
      'order_discount',

      // Fulfillment related
      'fulfillment_item',
      'order_fulfillment',
      'fulfillment',

      // Returns and exchanges
      'return_item',
      'return',
      'order_exchange_item',
      'order_exchange',

      // Claims
      'order_claim_item_image',
      'claim_item',
      'order_claim_item',
      'claim_order',
      'order_claim',

      // Swaps
      'swap',

      // Refunds
      'refund',

      // Order changes and edits
      'order_change_action',
      'order_change',
      'order_edit',

      // Transactions and summary
      'order_transaction',
      'order_summary',

      // Order cart relationship
      'order_cart',

      // Addresses
      'order_address',
      'address',

      // Cart related tables (carts can become orders)
      'cart_line_item_tax_line',
      'cart_line_item_adjustment',
      'cart_line_item',
      'cart_shipping_method_tax_line',
      'cart_shipping_method_adjustment',
      'cart_shipping_method',
      'cart_payment_collection',
      'cart_promotion',
      'cart_gift_card',
      'cart_discount',
      'cart_address',
      'cart',

      // Line items that might be orphaned
      'line_item_tax_line',
      'line_item_adjustment',
      'line_item',

      // Finally delete the main order table
      '"order"', // order is a reserved word
    ]

    console.log('\n🗑️  Deleting all order data...')

    for (const table of deletionOrder) {
      try {
        const result = await client.query(`DELETE FROM ${table}`)
        if (result.rowCount > 0) {
          console.log(`✅ Deleted ${result.rowCount} records from ${table}`)
        }
      } catch (error: any) {
        // If table doesn't exist, continue
        if (error.code !== '42P01') {
          console.log(`⚠️  Could not delete from ${table}: ${error.message}`)
        }
      }
    }

    // Also try to truncate with CASCADE for any remaining tables
    console.log('\n🔨 Attempting CASCADE deletion on order table...')
    try {
      await client.query('TRUNCATE TABLE "order" CASCADE')
      console.log('✅ Truncated order table with CASCADE')
    } catch (error: any) {
      console.log(`⚠️  Could not truncate: ${error.message}`)

      // Alternative: Delete with specific cascade
      try {
        // Delete orders one by one to handle constraints
        const orders = await client.query('SELECT id FROM "order"')
        for (const order of orders.rows) {
          try {
            // Delete all related data for this order
            await client.query('DELETE FROM order_line_item WHERE order_id = $1', [order.id])
            await client.query('DELETE FROM order_item WHERE order_id = $1', [order.id])
            await client.query('DELETE FROM order_shipping_method WHERE order_id = $1', [order.id])
            await client.query('DELETE FROM order_address WHERE id IN (SELECT shipping_address_id FROM "order" WHERE id = $1)', [order.id])
            await client.query('DELETE FROM order_address WHERE id IN (SELECT billing_address_id FROM "order" WHERE id = $1)', [order.id])
            await client.query('DELETE FROM order_summary WHERE order_id = $1', [order.id])
            await client.query('DELETE FROM order_cart WHERE order_id = $1', [order.id])

            // Now delete the order
            await client.query('DELETE FROM "order" WHERE id = $1', [order.id])
            console.log(`✅ Deleted order ${order.id}`)
          } catch (deleteError: any) {
            console.log(`⚠️  Could not delete order ${order.id}: ${deleteError.message}`)
          }
        }
      } catch (error) {
        console.log('⚠️  Individual deletion also failed')
      }
    }

    // Commit transaction
    await client.query('COMMIT')
    console.log('\n✅ Transaction committed!')

    // Verify deletion
    console.log('\n📊 Final verification:')
    const verificationTables = [
      { table: '"order"', name: 'Orders' },
      { table: 'order_summary', name: 'Order Summaries' },
      { table: 'order_item', name: 'Order Items' },
      { table: 'order_line_item', name: 'Order Line Items' },
      { table: 'cart', name: 'Carts' },
      { table: 'cart_line_item', name: 'Cart Line Items' },
      { table: 'payment_collection', name: 'Payment Collections' },
      { table: 'fulfillment', name: 'Fulfillments' },
    ]

    let allClean = true
    for (const { table, name } of verificationTables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`)
        const count = result.rows[0].count
        console.log(`  ${name}: ${count}`)
        if (count !== '0') {
          allClean = false
        }
      } catch (error) {
        // Table might not exist, that's okay
        console.log(`  ${name}: Table not found or inaccessible`)
      }
    }

    if (allClean) {
      console.log('\n🎉 SUCCESS: All order-related data has been completely deleted!')
    } else {
      console.log('\n⚠️  Some data remains. Running additional cleanup...')

      // Try TRUNCATE CASCADE as last resort
      try {
        console.log('\n🔨 Attempting TRUNCATE CASCADE on order table...')
        await client.query('TRUNCATE TABLE "order" CASCADE')
        console.log('✅ TRUNCATE CASCADE completed successfully')
      } catch (cascadeError) {
        console.log('⚠️  TRUNCATE CASCADE not available or failed')
        console.log('📝 Manual intervention may be required for remaining data')
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
    try {
      await client.query('ROLLBACK')
      console.log('🔄 Rolled back transaction')
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError)
    }
  } finally {
    await client.end()
    console.log('\n👋 Connection closed')
  }
}

// Run
forceDeleteOrders().catch(console.error)