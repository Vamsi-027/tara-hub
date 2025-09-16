#!/usr/bin/env node

/**
 * Clear Orders Script
 * Clears existing orders and related data from the database
 */

const { Client } = require('pg')
require('dotenv').config()

async function clearOrders() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!databaseUrl) {
    console.error('❌ No database URL found in environment variables')
    process.exit(1)
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
  })

  try {
    await client.connect()
    console.log('🔗 Connected to database')

    // Clear orders and related tables
    console.log('🗑️  Clearing existing orders...')

    await client.query('DELETE FROM order_item WHERE 1=1')
    console.log('✅ Cleared order_item table')

    await client.query('DELETE FROM "order" WHERE 1=1')
    console.log('✅ Cleared order table')

    await client.query('DELETE FROM customer WHERE 1=1')
    console.log('✅ Cleared customer table')

    // Also clear backup table if it exists
    try {
      await client.query('DROP TABLE IF EXISTS fabric_orders')
      console.log('✅ Dropped fabric_orders backup table')
    } catch (error) {
      console.log('ℹ️  No fabric_orders table to drop')
    }

    console.log('🎉 All orders cleared successfully!')

  } catch (error) {
    console.error('❌ Error clearing orders:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

clearOrders()