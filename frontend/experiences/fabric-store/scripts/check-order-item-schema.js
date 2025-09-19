/**
 * Check Order Item Table Schema
 */

const { Client } = require('pg')

const DATABASE_URL = 'postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require'

async function checkOrderItemSchema() {
  console.log('🔍 Checking Order Item Table Schema')

  try {
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })

    await client.connect()
    console.log('✅ Connected to database')

    // Check order_item table structure
    const schemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'order_item'
      ORDER BY ordinal_position;
    `

    const schemaResult = await client.query(schemaQuery)
    if (schemaResult.rows.length > 0) {
      console.log('📦 order_item table columns:')
      schemaResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.column_name} (${row.data_type})`)
      })

      // Get sample order item data
      const sampleQuery = 'SELECT * FROM order_item LIMIT 1'
      const sampleResult = await client.query(sampleQuery)
      if (sampleResult.rows.length > 0) {
        console.log('\n📦 Sample order_item data:')
        const item = sampleResult.rows[0]
        Object.keys(item).forEach(key => {
          console.log(`   ${key}: ${item[key]}`)
        })
      }
    } else {
      console.log('❌ order_item table not found')
    }

    // Look for tables with quantity information
    console.log('\n🔍 Looking for tables with quantity columns...')
    const quantityTablesQuery = `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name LIKE '%quantity%'
      AND table_schema = 'public'
      ORDER BY table_name, column_name;
    `

    const quantityResult = await client.query(quantityTablesQuery)
    console.log('📊 Tables with quantity columns:')
    quantityResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}.${row.column_name}`)
    })

    await client.end()
    console.log('\n🔌 Database connection closed')

  } catch (error) {
    console.error('❌ Database error:', error.message)
  }
}

checkOrderItemSchema().catch(console.error)