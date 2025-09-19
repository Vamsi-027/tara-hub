/**
 * Check Order Table Schema
 * Inspects the actual order table structure in the database
 */

const { Client } = require('pg')

const DATABASE_URL = 'postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require'

async function checkOrderSchema() {
  console.log('🔍 Checking Order Table Schema')
  console.log('🌐 Database:', DATABASE_URL.split('@')[1])
  console.log('')

  try {
    const client = new Client({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })

    await client.connect()
    console.log('✅ Connected to database')

    // Check if order table exists and get its structure
    const schemaQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'order'
      ORDER BY ordinal_position;
    `

    const schemaResult = await client.query(schemaQuery)

    if (schemaResult.rows.length === 0) {
      console.log('❌ Order table not found')

      // Check what tables exist
      const tablesQuery = `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%order%'
        ORDER BY table_name;
      `

      const tablesResult = await client.query(tablesQuery)
      console.log('📋 Tables with "order" in name:', tablesResult.rows.map(r => r.table_name))
    } else {
      console.log('📋 Order table columns:')
      schemaResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
      })
    }

    // Check if there are any orders
    const countQuery = 'SELECT COUNT(*) as total FROM "order"'
    const countResult = await client.query(countQuery)
    console.log(`\n📊 Total orders in table: ${countResult.rows[0]?.total || 0}`)

    // Get a sample order to see the actual data structure
    if (parseInt(countResult.rows[0]?.total || '0') > 0) {
      const sampleQuery = 'SELECT * FROM "order" LIMIT 1'
      const sampleResult = await client.query(sampleQuery)

      if (sampleResult.rows.length > 0) {
        console.log('\n📦 Sample order data:')
        const order = sampleResult.rows[0]
        Object.keys(order).forEach(key => {
          const value = order[key]
          console.log(`   ${key}: ${typeof value} = ${String(value).substring(0, 50)}${String(value).length > 50 ? '...' : ''}`)
        })
      }
    }

    await client.end()
    console.log('\n🔌 Database connection closed')

  } catch (error) {
    console.error('❌ Database error:', error.message)
  }
}

checkOrderSchema().catch(console.error)