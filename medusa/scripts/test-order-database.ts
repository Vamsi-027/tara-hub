import { Client } from 'pg'

export default async () => {
  console.log('🧪 Testing order database storage...')
  
  try {
    // Test our new fabric-db endpoint
    const testOrder = {
      orderId: `test_order_${Date.now()}`,
      email: 'test@example.com',
      items: [
        {
          id: 'test-item-1',
          title: 'Test Fabric Sample',
          variant: 'Swatch Sample',
          price: 500,
          quantity: 1,
          type: 'swatch'
        }
      ],
      shipping: {
        firstName: 'Test',
        lastName: 'Customer',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US'
      },
      totals: {
        subtotal: 500,
        shipping: 1000,
        tax: 40,
        total: 1540
      },
      paymentIntentId: `pi_test_${Date.now()}`,
      status: 'pending'
    }

    console.log(`📦 Testing order: ${testOrder.orderId}`)
    console.log(`   Email: ${testOrder.email}`)
    console.log(`   Total: $${(testOrder.totals.total / 100).toFixed(2)}`)
    
    // Test the new fabric-db endpoint
    console.log('\n🔄 Testing /fabric-db endpoint...')
    const response = await fetch('http://localhost:9000/fabric-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Database storage test SUCCESSFUL!')
      console.log(`   Order ID: ${result.order.id}`)
      console.log(`   Email: ${result.order.email}`)
      console.log(`   Total: $${(result.order.total / 100).toFixed(2)}`)
      console.log(`   Created: ${result.order.created_at}`)
      console.log(`   Database stored: ${result.order.database_stored}`)
    } else {
      const error = await response.json()
      console.error('❌ Database storage test FAILED!')
      console.error(`   Status: ${response.status}`)
      console.error(`   Error: ${error.error}`)
      console.error(`   Message: ${error.message}`)
    }

    // Also verify the order was actually stored in the database
    console.log('\n🔍 Verifying database storage...')
    const databaseUrl = process.env.DATABASE_URL
    
    if (databaseUrl) {
      const client = new Client({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false
      })
      
      await client.connect()
      
      const result = await client.query(
        'SELECT id, email, total_amount, created_at FROM fabric_orders WHERE id = $1',
        [testOrder.orderId]
      )
      
      if (result.rows.length > 0) {
        const dbOrder = result.rows[0]
        console.log('✅ Order found in database!')
        console.log(`   Database ID: ${dbOrder.id}`)
        console.log(`   Email: ${dbOrder.email}`) 
        console.log(`   Amount: $${(dbOrder.total_amount / 100).toFixed(2)}`)
        console.log(`   Created: ${dbOrder.created_at}`)
      } else {
        console.log('❌ Order NOT found in database!')
      }
      
      await client.end()
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}