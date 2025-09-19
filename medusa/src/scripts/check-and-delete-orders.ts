/**
 * Script to check table structure and delete all orders from Medusa database
 */

import * as dotenv from 'dotenv'
import { Client } from 'pg'

// Load environment variables
dotenv.config({ path: '.env' })

async function checkAndDeleteOrders() {
  console.log('🔍 Checking database structure and deleting orders...')

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

    // First, let's see what tables exist
    console.log('\n📋 Checking existing tables...')
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%order%' OR table_name LIKE '%cart%' OR table_name LIKE '%line%'
      ORDER BY table_name;
    `
    const tables = await client.query(tablesQuery)
    console.log('Found tables:')
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`))

    // Check current order count
    console.log('\n📊 Current order status:')
    const orderTables = tables.rows.filter(row => row.table_name.includes('order'))

    for (const { table_name } of orderTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${table_name}"`)
        console.log(`  ${table_name}: ${countResult.rows[0].count} records`)
      } catch (error) {
        console.log(`  ${table_name}: Unable to count`)
      }
    }

    // Start deletion
    console.log('\n🗑️  Starting deletion process...')
    await client.query('BEGIN')

    // Delete from order-related tables
    const orderRelatedTables = [
      'order_line_item',
      'order_line_items',
      'line_item',
      'order_item',
      'order_items',
      'order_shipping',
      'order_payment',
      'order_fulfillment',
      'order_refund',
      'order_return',
      'order_claim',
      'order_swap',
      'order_edit',
      'order_change',
      'order_discount',
      'order_gift_card',
      'order_transaction',
      'payment_collection',
      'order' // Try without quotes first
    ]

    for (const tableName of orderRelatedTables) {
      try {
        const result = await client.query(`DELETE FROM ${tableName}`)
        if (result.rowCount > 0) {
          console.log(`✅ Deleted ${result.rowCount} records from ${tableName}`)
        }
      } catch (error) {
        // Try with quotes if first attempt fails
        try {
          const result = await client.query(`DELETE FROM "${tableName}"`)
          if (result.rowCount > 0) {
            console.log(`✅ Deleted ${result.rowCount} records from "${tableName}"`)
          }
        } catch (quotedError) {
          // Table doesn't exist or no permission
        }
      }
    }

    // Also delete carts
    console.log('\n🛒 Deleting cart data...')
    const cartTables = ['cart_line_item', 'cart_line_items', 'cart_item', 'cart_items', 'cart']

    for (const tableName of cartTables) {
      try {
        const result = await client.query(`DELETE FROM ${tableName}`)
        if (result.rowCount > 0) {
          console.log(`✅ Deleted ${result.rowCount} records from ${tableName}`)
        }
      } catch (error) {
        try {
          const result = await client.query(`DELETE FROM "${tableName}"`)
          if (result.rowCount > 0) {
            console.log(`✅ Deleted ${result.rowCount} records from "${tableName}"`)
          }
        } catch (quotedError) {
          // Table doesn't exist
        }
      }
    }

    // Commit transaction
    await client.query('COMMIT')
    console.log('\n✅ Transaction committed!')

    // Verify deletion
    console.log('\n📊 Final verification:')
    for (const { table_name } of orderTables) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${table_name}"`)
        console.log(`  ${table_name}: ${countResult.rows[0].count} records remaining`)
      } catch (error) {
        console.log(`  ${table_name}: Unable to verify`)
      }
    }

    // Check cart tables too
    const cartTablesFinal = tables.rows.filter(row => row.table_name.includes('cart'))
    for (const { table_name } of cartTablesFinal) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${table_name}"`)
        console.log(`  ${table_name}: ${countResult.rows[0].count} records remaining`)
      } catch (error) {
        console.log(`  ${table_name}: Unable to verify`)
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error)

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
checkAndDeleteOrders().catch(console.error)