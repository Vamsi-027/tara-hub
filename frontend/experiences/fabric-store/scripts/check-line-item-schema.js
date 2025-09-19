/**
 * Check Order Line Item Table Schema
 */

const { Client } = require('pg')

const DATABASE_URL = 'postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require'

async function checkLineItemSchema() {
  console.log('🔍 Checking Order Line Item Table Schema')

  try {
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })

    await client.connect()
    console.log('✅ Connected to database')

    // Check order_line_item table structure
    const schemaQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'order_line_item'
      ORDER BY ordinal_position;
    `

    const schemaResult = await client.query(schemaQuery)
    console.log('📦 order_line_item table columns:')
    schemaResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.column_name} (${row.data_type})`)
    })

    // Get sample line item data
    const sampleQuery = 'SELECT * FROM order_line_item LIMIT 1'
    const sampleResult = await client.query(sampleQuery)
    if (sampleResult.rows.length > 0) {
      console.log('\n📦 Sample order_line_item data:')
      const item = sampleResult.rows[0]
      Object.keys(item).forEach(key => {
        console.log(`   ${key}: ${item[key]}`)
      })
    }

    await client.end()
    console.log('\n🔌 Database connection closed')

  } catch (error) {
    console.error('❌ Database error:', error.message)
  }
}

checkLineItemSchema().catch(console.error)