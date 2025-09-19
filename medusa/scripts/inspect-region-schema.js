#!/usr/bin/env node
/**
 * Inspect Region and Payment Provider Schema
 */

const { Client } = require('pg')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function inspectSchema() {
  const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment')
    process.exit(1)
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    await client.connect()
    console.log('✅ Connected to database\n')

    // Check region_payment_provider columns
    console.log('🔍 Inspecting region_payment_provider table...')
    const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'region_payment_provider'
      ORDER BY ordinal_position
    `
    const columnsResult = await client.query(columnsQuery)

    if (columnsResult.rows.length > 0) {
      console.log('Columns in region_payment_provider:')
      columnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`)
      })
    } else {
      console.log('❌ Table region_payment_provider not found or no columns')
    }

    // Check current data
    console.log('\n🔍 Current region_payment_provider data...')
    const dataQuery = `
      SELECT * FROM "region_payment_provider"
      LIMIT 10
    `
    try {
      const dataResult = await client.query(dataQuery)
      console.log(`Found ${dataResult.rowCount} rows`)
      if (dataResult.rowCount > 0) {
        console.log('Sample row:', dataResult.rows[0])
      }
    } catch (e) {
      console.log('Error reading data:', e.message)
    }

    // Check region columns
    console.log('\n🔍 Inspecting region table...')
    const regionColumnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'region'
      AND column_name LIKE '%provider%'
      ORDER BY ordinal_position
    `
    const regionColumnsResult = await client.query(regionColumnsQuery)

    if (regionColumnsResult.rows.length > 0) {
      console.log('Provider-related columns in region:')
      regionColumnsResult.rows.forEach(row => {
        console.log(`  - ${row.column_name} (${row.data_type})`)
      })
    } else {
      console.log('No provider-related columns found in region table')
    }

    // Check payment_provider table
    console.log('\n🔍 Inspecting payment_provider table...')
    const ppQuery = `
      SELECT * FROM "payment_provider"
      WHERE id = 'stripe'
      LIMIT 1
    `
    try {
      const ppResult = await client.query(ppQuery)
      if (ppResult.rowCount > 0) {
        console.log('Stripe provider data:', ppResult.rows[0])
      } else {
        console.log('Stripe provider not found')
      }
    } catch (e) {
      console.log('Error reading payment_provider:', e.message)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await client.end()
    console.log('\n📊 Database connection closed')
  }
}

// Run the script
if (require.main === module) {
  inspectSchema()
}

module.exports = { inspectSchema }