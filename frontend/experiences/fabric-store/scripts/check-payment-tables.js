/**
 * Check Payment and Order Summary Tables
 * Inspects related tables for payment status and totals
 */

const { Client } = require('pg')

const DATABASE_URL = 'postgres://neondb_owner:npg_G5TRPiX4oWCB@ep-icy-shadow-ad2nyi3l-pooler.c-2.us-east-1.aws.neon.tech/medusa?sslmode=require'

async function checkPaymentTables() {
  console.log('🔍 Checking Payment and Order Summary Tables')
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

    // Find all tables that might contain order-related data
    const tablesQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (
        table_name LIKE '%payment%' OR
        table_name LIKE '%order%' OR
        table_name LIKE '%total%' OR
        table_name LIKE '%summary%' OR
        table_name LIKE '%line%'
      )
      ORDER BY table_name;
    `

    const tablesResult = await client.query(tablesQuery)
    console.log('📋 Related tables:')
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`)
    })

    // Check order_summary table if it exists
    const orderSummaryQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'order_summary'
      ORDER BY ordinal_position;
    `

    const orderSummaryResult = await client.query(orderSummaryQuery)
    if (orderSummaryResult.rows.length > 0) {
      console.log('\n📊 order_summary table columns:')
      orderSummaryResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.column_name} (${row.data_type})`)
      })

      // Get sample data
      const sampleSummaryQuery = 'SELECT * FROM order_summary LIMIT 1'
      const sampleSummaryResult = await client.query(sampleSummaryQuery)
      if (sampleSummaryResult.rows.length > 0) {
        console.log('\n📦 Sample order_summary data:')
        const summary = sampleSummaryResult.rows[0]
        Object.keys(summary).forEach(key => {
          console.log(`   ${key}: ${summary[key]}`)
        })
      }
    }

    // Check payment table if it exists
    const paymentQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'payment'
      ORDER BY ordinal_position;
    `

    const paymentResult = await client.query(paymentQuery)
    if (paymentResult.rows.length > 0) {
      console.log('\n💳 payment table columns:')
      paymentResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.column_name} (${row.data_type})`)
      })
    }

    // Check line_item table
    const lineItemQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'line_item'
      ORDER BY ordinal_position;
    `

    const lineItemResult = await client.query(lineItemQuery)
    if (lineItemResult.rows.length > 0) {
      console.log('\n📦 line_item table columns:')
      lineItemResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.column_name} (${row.data_type})`)
      })
    }

    // Find orders for our test email
    console.log('\n🔍 Searching for orders with email: vamsicheruku027@gmail.com')
    const emailSearchQuery = `
      SELECT id, email, display_id, status, created_at
      FROM "order"
      WHERE LOWER(email) = LOWER($1)
    `
    const emailResult = await client.query(emailSearchQuery, ['vamsicheruku027@gmail.com'])

    console.log(`📊 Found ${emailResult.rows.length} orders for vamsicheruku027@gmail.com`)
    emailResult.rows.forEach((order, index) => {
      console.log(`   ${index + 1}. Order ${order.display_id} (${order.id}) - Status: ${order.status} - Created: ${order.created_at}`)
    })

    await client.end()
    console.log('\n🔌 Database connection closed')

  } catch (error) {
    console.error('❌ Database error:', error.message)
  }
}

checkPaymentTables().catch(console.error)