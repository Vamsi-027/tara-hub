// Reset all Medusa database tables except materials table
const { Pool } = require('pg')
require('dotenv').config({ path: './medusa/.env' })

const PRODUCTION_DB_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:FwPq7MfR2U0K@ep-holy-block-a8k3b7b8-pooler.eastus2.azure.neon.tech/materials-db?sslmode=require'

async function resetMedusaDatabase() {
  console.log('🔄 RESETTING MEDUSA DATABASE (Preserving Materials Table)\n')
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
    const tablesToReset = allTables.filter(table =>
      !preserveTables.some(preserve => table.toLowerCase().includes(preserve.toLowerCase()))
    )

    console.log('📊 Table Analysis:')
    console.log(`  Preserving: ${preserveTables.join(', ')}`)
    console.log(`  Resetting: ${tablesToReset.length} tables\n`)

    // Disable foreign key checks temporarily
    console.log('2️⃣ Disabling foreign key constraints...')
    await pool.query('SET session_replication_role = replica;')

    // TRUNCATE all tables except materials
    console.log('3️⃣ Truncating Medusa tables...\n')

    for (const table of tablesToReset) {
      try {
        // Special handling for migration tables - don't truncate them
        if (table.includes('migration') || table.includes('typeorm')) {
          console.log(`  ⏭️  Skipping migration table: ${table}`)
          continue
        }

        console.log(`  🗑️  Truncating: ${table}`)
        await pool.query(`TRUNCATE TABLE "${table}" CASCADE;`)

        // Reset sequences if they exist
        const sequenceName = `${table}_id_seq`
        try {
          await pool.query(`ALTER SEQUENCE "${sequenceName}" RESTART WITH 1;`)
        } catch (e) {
          // Sequence might not exist for this table
        }
      } catch (err) {
        console.log(`     ⚠️  Warning: ${err.message}`)
      }
    }

    // Re-enable foreign key checks
    console.log('\n4️⃣ Re-enabling foreign key constraints...')
    await pool.query('SET session_replication_role = DEFAULT;')

    // Verify materials table still has data
    console.log('\n5️⃣ Verifying materials table preservation...')
    const materialsCount = await pool.query('SELECT COUNT(*) FROM materials;')
    console.log(`  ✅ Materials table has ${materialsCount.rows[0].count} records`)

    // Check some important Medusa tables are now empty
    console.log('\n6️⃣ Verifying Medusa tables are reset:')
    const checkTables = ['product', 'cart', '"order"', 'customer', 'region', 'price_list']

    for (const table of checkTables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table};`)
        const count = result.rows[0].count
        console.log(`  ${table}: ${count} records ${count === '0' ? '✅' : '⚠️'}`)
      } catch (e) {
        console.log(`  ${table}: Table might not exist`)
      }
    }

    console.log('\n' + '=' .repeat(60))
    console.log('✅ Database reset complete!')
    console.log('\n⚠️  IMPORTANT NEXT STEPS:')
    console.log('1. Run Medusa migrations to recreate initial data:')
    console.log('   cd medusa && npm run migrations:run')
    console.log('2. Create a new admin user:')
    console.log('   cd medusa && npm run user:create')
    console.log('3. Seed initial data if needed:')
    console.log('   cd medusa && npm run seed')

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

console.log('⚠️  WARNING: This will DELETE all data except materials!')
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