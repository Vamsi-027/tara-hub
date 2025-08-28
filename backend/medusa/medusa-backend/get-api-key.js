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

async function getApiKey() {
  try {
    await client.connect()
    console.log('Connected to database\n')
    
    // Check if api_key table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_key'
      );
    `)
    
    if (tableCheck.rows[0].exists) {
      // Get publishable keys
      const keysResult = await client.query(`
        SELECT token, title, type, created_at 
        FROM api_key 
        WHERE type = 'publishable' 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      if (keysResult.rows.length > 0) {
        console.log('📋 Publishable API Keys:')
        keysResult.rows.forEach(key => {
          console.log(`\n  Title: ${key.title}`)
          console.log(`  Token: ${key.token}`)
          console.log(`  Type: ${key.type}`)
          console.log(`  Created: ${key.created_at}`)
        })
      } else {
        console.log('❌ No publishable API keys found')
        
        // Create a default publishable key
        const newKey = 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        const insertResult = await client.query(`
          INSERT INTO api_key (id, token, title, type, created_at, updated_at)
          VALUES (
            'apk_' || substr(md5(random()::text), 1, 16),
            $1,
            'Default Store Key',
            'publishable',
            NOW(),
            NOW()
          )
          RETURNING token
        `, [newKey])
        
        console.log('\n✅ Created new publishable API key:')
        console.log(`  Token: ${insertResult.rows[0].token}`)
      }
    } else {
      console.log('❌ API key table does not exist')
      
      // List tables to understand structure
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%key%'
        ORDER BY table_name;
      `)
      
      if (tablesResult.rows.length > 0) {
        console.log('\n📋 Key-related tables:')
        tablesResult.rows.forEach(row => {
          console.log(`  - ${row.table_name}`)
        })
      } else {
        console.log('\nNo key-related tables found')
      }
    }
    
    await client.end()
  } catch (err) {
    console.error('Error:', err.message)
    console.error('Details:', err.detail || '')
  }
}

getApiKey()