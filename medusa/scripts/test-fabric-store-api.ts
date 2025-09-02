export default async () => {
  console.log('🧪 Testing end-to-end fabric store API order creation...')
  
  try {
    const testOrder = {
      orderId: `e2e_order_${Date.now()}`,
      email: 'e2e.test@example.com',
      items: [
        {
          id: 'fabric-prod_test_123',
          title: 'Test E2E Fabric',
          variant: '1 yard',
          price: 2500, // $25.00
          quantity: 1
        }
      ],
      shipping: {
        firstName: 'End-to-End',
        lastName: 'Test',
        address: '456 E2E Test Ave',
        city: 'Test City',
        state: 'TC',
        zipCode: '54321',
        country: 'US'
      },
      total: 3540, // $35.40 including shipping and tax
      paymentIntentId: `pi_e2e_${Date.now()}`,
      status: 'pending'
    }

    console.log(`📦 Creating order: ${testOrder.orderId}`)
    console.log(`   Email: ${testOrder.email}`)
    console.log(`   Total: $${(testOrder.total / 100).toFixed(2)}`)
    
    // Test the fabric store API endpoint
    console.log('\n🔄 Testing fabric store /api/orders endpoint...')
    const response = await fetch('http://localhost:3006/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Fabric store API test SUCCESSFUL!')
      console.log(`   Order ID: ${result.order.id}`)
      console.log(`   Email: ${result.order.email}`)
      console.log(`   Total: $${(result.order.totals.total / 100).toFixed(2)}`)
      console.log(`   Status: ${result.order.status}`)
      console.log(`   File storage: ${result.storage.file}`)
      console.log(`   Database storage: ${result.storage.database}`)
      
      // Check timeline for database storage confirmation
      const hasDbSuccess = result.order.timeline.some((entry: any) => 
        entry.status === 'database_stored'
      )
      const hasDbError = result.order.timeline.some((entry: any) => 
        entry.status === 'database_error'
      )
      
      if (hasDbSuccess) {
        console.log('✅ Database storage confirmed in timeline')
      } else if (hasDbError) {
        console.log('❌ Database error found in timeline')
      } else {
        console.log('⚠️  No database timeline entry found')
      }
      
    } else {
      const error = await response.json()
      console.error('❌ Fabric store API test FAILED!')
      console.error(`   Status: ${response.status}`)
      console.error(`   Error: ${JSON.stringify(error)}`)
    }

  } catch (error) {
    console.error('❌ End-to-end test failed with error:', error)
  }
}