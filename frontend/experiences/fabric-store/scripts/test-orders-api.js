/**
 * Test Orders API with Admin Authentication
 * Tests the new secure orders retrieval endpoint
 */

const FABRIC_STORE_URL = 'http://localhost:3006'
const TEST_EMAIL = 'vamsicheruku027@gmail.com'

async function testOrdersAPI() {
  console.log('🧪 Testing Orders API with Admin Authentication')
  console.log('📧 Testing email:', TEST_EMAIL)
  console.log('🌐 Fabric Store URL:', FABRIC_STORE_URL)
  console.log('')

  try {
    console.log('1️⃣ Testing orders API...')

    const response = await fetch(`${FABRIC_STORE_URL}/api/orders?email=${encodeURIComponent(TEST_EMAIL)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ API Response Success!')
      console.log(`📦 Orders found: ${data.data?.count || 0}`)
      console.log(`🔍 Source: ${data.metadata?.source || 'unknown'}`)
      console.log(`⏱️ Response time: ${data.metadata?.response_time_ms || 0}ms`)

      if (data.data?.orders && data.data.orders.length > 0) {
        console.log('\n🎯 ORDERS FOUND! Sample order:')
        const order = data.data.orders[0]
        console.log(`   - ID: ${order.id}`)
        console.log(`   - Display ID: ${order.display_id}`)
        console.log(`   - Email: ${order.email}`)
        console.log(`   - Status: ${order.status}`)
        console.log(`   - Payment Status: ${order.payment_status}`)
        console.log(`   - Total: ${order.total} ${order.currency_code}`)
        console.log(`   - Created: ${order.created_at}`)
        console.log(`   - Items: ${order.items?.length || 0}`)

        if (order.items && order.items.length > 0) {
          console.log('\n📦 Order Items:')
          order.items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.title} - Qty: ${item.quantity} - Price: ${item.unit_price}`)
          })
        }

        return {
          success: true,
          orders_found: data.data.orders.length,
          working_endpoint: '/api/orders',
          authentication: 'admin_authenticated'
        }
      } else {
        console.log('\n⚠️ No orders found for this email')
        console.log('💡 This could mean:')
        console.log('   - Customer has not placed any orders yet')
        console.log('   - Email address might be different in database')
        console.log('   - Orders might be stored in a different format')

        return {
          success: true,
          orders_found: 0,
          note: 'API works but no orders found'
        }
      }
    } else {
      const errorText = await response.text()
      console.log('❌ API Error:')
      console.log(errorText)

      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

// Run the test
testOrdersAPI().then(result => {
  console.log('\n' + '='.repeat(50))
  if (result.success) {
    console.log('🎉 TEST COMPLETED SUCCESSFULLY!')
    if (result.orders_found > 0) {
      console.log(`📦 Found ${result.orders_found} orders using admin authentication`)
      console.log('✅ Orders API is working correctly!')
    } else {
      console.log('✅ API authentication works, but no orders found')
      console.log('🔍 Check if orders exist in Medusa database for this email')
    }
  } else {
    console.log('❌ TEST FAILED!')
    console.log(`Error: ${result.error}`)
    console.log('🔧 Check fabric-store is running on port 3006 and Medusa is accessible')
  }
  console.log('='.repeat(50))
}).catch(error => {
  console.error('Script error:', error)
})