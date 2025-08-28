const { Client } = require('pg')
require('dotenv').config()

const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function checkFabrics() {
  try {
    await client.connect()
    console.log('Connected to database\n')
    
    // Check if fabrics table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fabrics'
      );
    `)
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Fabrics table exists')
      
      // Count rows
      const countResult = await client.query('SELECT COUNT(*) FROM fabrics')
      const count = parseInt(countResult.rows[0].count)
      console.log(`📊 Total fabrics in database: ${count}`)
      
      if (count > 0) {
        // Get sample data
        const sampleResult = await client.query('SELECT id, name, category, status FROM fabrics LIMIT 5')
        console.log('\n📋 Sample fabrics:')
        sampleResult.rows.forEach(fabric => {
          console.log(`  - ${fabric.name} (${fabric.category}) - Status: ${fabric.status}`)
        })
      }
    } else {
      console.log('❌ Fabrics table does not exist')
      
      // List all tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `)
      
      console.log('\n📋 Available tables in public schema:')
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`)
      })
    }
    
    await client.end()
  } catch (err) {
    console.error('Error:', err.message)
  }
}

checkFabrics()