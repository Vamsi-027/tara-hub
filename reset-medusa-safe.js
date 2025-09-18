// Safe reset of Medusa database tables (works with Neon permissions)
const { Pool } = require('pg')
require('dotenv').config({ path: './medusa/.env' })

const PRODUCTION_DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:FwPq7MfR2U0K@ep-holy-block-a8k3b7b8-pooler.eastus2.azure.neon.tech/materials-db?sslmode=require'

async function resetMedusaDatabase() {
  console.log('🔄 SAFE RESET OF MEDUSA DATABASE (Preserving Materials Table)\n')
  console.log('=' .repeat(60))

  const pool = new Pool({
    connectionString: PRODUCTION_DB_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    // First, get list of all tables
    console.log('1️⃣ Fetching all tables in database...')
    const tablesResult = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `)

    const allTables = tablesResult.rows.map(row => row.tablename)
    console.log(`Found ${allTables.length} tables total\n`)

    // Tables to preserve
    const preserveTables = ['materials', 'material', 'fabric_materials']
    const migrationTables = ['migration', 'typeorm', 'mikro_orm_migrations']

    const tablesToReset = allTables.filter(table => {
      const tableLower = table.toLowerCase()
      // Don't reset materials tables
      if (preserveTables.some(preserve => tableLower.includes(preserve.toLowerCase()))) {
        return false
      }
      // Don't reset migration tables
      if (migrationTables.some(migration => tableLower.includes(migration.toLowerCase()))) {
        return false
      }
      return true
    })

    console.log('📊 Table Analysis:')
    console.log(`  Preserving: ${preserveTables.join(', ')}`)
    console.log(`  Skipping migration tables`)
    console.log(`  Resetting: ${tablesToReset.length} tables\n`)

    // Delete data from each table individually (safer than TRUNCATE)
    console.log('2️⃣ Deleting data from Medusa tables...\n')

    const criticalTables = [
      // Delete in order to avoid foreign key issues
      'order_line_item',
      'line_item',
      'order_summary',
      'order',
      'payment',
      'payment_collection',
      'cart_line_item',
      'cart',
      'product_variant_price_set',
      'product_variant_inventory_item',
      'product_variant',
      'product_category_product',
      'product_collection',
      'product_option_value',
      'product_option',
      'product_image',
      'product_tag',
      'product_type',
      'product',
      'price_rule',
      'price_set_money_amount',
      'money_amount',
      'price_set',
      'price_list',
      'region_payment_provider',
      'region_fulfillment_provider',
      'region_country',
      'region',
      'shipping_option',
      'shipping_profile',
      'fulfillment',
      'customer_address',
      'customer_group_customer',
      'customer_group',
      'customer',
      'store',
      'sales_channel',
      'user',
      'invite',
      'api_key',
      'notification',
      'workflow_execution',
      'price_preference'
    ]

    let deletedCount = 0
    let skippedCount = 0

    for (const table of criticalTables) {
      try {
        // Check if table exists
        const exists = allTables.includes(table)
        if (!exists) {
          console.log(`  ⏭️  Table doesn't exist: ${table}`)
          skippedCount++
          continue
        }

        // Delete all records
        const result = await pool.query(`DELETE FROM "${table}";`)
        console.log(`  ✅ Deleted from ${table}: ${result.rowCount} rows`)
        deletedCount++

        // Try to reset sequence if it exists
        try {
          await pool.query(`ALTER SEQUENCE "${table}_id_seq" RESTART WITH 1;`)
        } catch (e) {
          // Sequence might not exist
        }
      } catch (err) {
        console.log(`  ⚠️  Could not delete from ${table}: ${err.message.split('\n')[0]}`)
        skippedCount++
      }
    }

    // Handle any remaining tables not in our list
    console.log('\n3️⃣ Cleaning remaining tables...')

    for (const table of tablesToReset) {
      if (!criticalTables.includes(table)) {
        try {
          const result = await pool.query(`DELETE FROM "${table}";`)
          if (result.rowCount > 0) {
            console.log(`  ✅ Deleted from ${table}: ${result.rowCount} rows`)
            deletedCount++
          }
        } catch (err) {
          // Silently skip tables we can't delete from
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`  Tables cleaned: ${deletedCount}`)
    console.log(`  Tables skipped: ${skippedCount}`)

    // Verify materials table still has data
    console.log('\n4️⃣ Verifying materials table preservation...')
    const materialsCount = await pool.query('SELECT COUNT(*) FROM materials;')
    console.log(`  ✅ Materials table has ${materialsCount.rows[0].count} records preserved`)

    // Check some important Medusa tables are now empty
    console.log('\n5️⃣ Verifying key Medusa tables are reset:')
    const checkTables = ['product', 'cart', '"order"', 'customer', 'region', 'user']

    for (const table of checkTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table};`)
        const count = result.rows[0].count
        console.log(`  ${table.replace('"', '').replace('"', '')}: ${count} records ${count === '0' ? '✅ Empty' : '⚠️  Has data'}`)
      } catch (e) {
        console.log(`  ${table}: Not found`)
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log('✅ Database reset complete!')
    console.log('\n📝 NEXT STEPS:')
    console.log('1. Restart Medusa to initialize default data:')
    console.log('   cd medusa && npm run dev')
    console.log('\n2. Create a new admin user:')
    console.log('   cd medusa && npx medusa user --email admin@tara-hub.com --password supersecretpassword')
    console.log('\n3. The default region and settings will be created on Medusa startup')

  } catch (error) {
    console.error('❌ Error resetting database:', error)
  } finally {
    await pool.end()
  }
}

// Add confirmation prompt
const readline = require('readline')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('⚠️  WARNING: This will DELETE all Medusa data except materials!')
console.log('Database: materials-db (Production)')
console.log('')

rl.question('Type "RESET" to confirm: ', (answer) => {
  if (answer === 'RESET') {
    resetMedusaDatabase()
      .then(() => rl.close())
      .catch(console.error)
  } else {
    console.log('❌ Reset cancelled')
    rl.close()
  }
})