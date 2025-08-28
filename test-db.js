const { Client } = require('pg')
require('dotenv').config({ path: '.env.local' })

const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL

console.log('Testing database connection...')
console.log('DATABASE_URL exists:', !!DATABASE_URL)

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function testConnection() {
  try {
    await client.connect()
    console.log('✅ Connected to database!')
    
    const result = await client.query('SELECT COUNT(*) FROM fabrics')
    console.log('✅ Fabrics count:', result.rows[0].count)
    
    await client.end()
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
    console.error('Error code:', err.code)
  }
}

testConnection()