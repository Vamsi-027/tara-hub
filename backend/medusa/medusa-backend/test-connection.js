const { Client } = require('pg')
require('dotenv').config()

const DATABASE_URL = process.env.POSTGRES_URL_NON_POOLING || 
  process.env.DATABASE_URL || 
  process.env.POSTGRES_URL

console.log('Testing connection to database...')
console.log('Database URL:', DATABASE_URL ? 'Configured' : 'Not found')

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    require: true
  }
})

async function testConnection() {
  try {
    await client.connect()
    console.log('✅ Successfully connected to database!')
    
    const res = await client.query('SELECT NOW()')
    console.log('Current time from DB:', res.rows[0])
    
    await client.end()
    console.log('✅ Connection closed successfully')
  } catch (err) {
    console.error('❌ Connection failed:', err.message)
    console.error('Error details:', err)
  }
}

testConnection()