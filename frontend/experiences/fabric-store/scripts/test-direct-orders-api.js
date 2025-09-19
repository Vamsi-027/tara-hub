/**
 * Test Direct Database Orders API
 * Tests the new endpoint that bypasses Medusa API authentication
 */

const FABRIC_STORE_URL = 'http://localhost:3006'
const TEST_EMAIL = 'vamsicheruku027@gmail.com'

async function testDirectOrdersAPI() {
  console.log('🎯 Testing Direct Database Orders API')
  console.log('📧 Testing email:', TEST_EMAIL)
  console.log('🌐 Fabric Store URL:', FABRIC_STORE_URL)
  console.log('')

  try {
    console.log('1️⃣ Testing direct database orders API...')

    const response = await fetch(`${FABRIC_STORE_URL}/api/store/orders-by-email?email=${encodeURIComponent(TEST_EMAIL)}`, {
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
      console.log(`📊 Total in database: ${data.data?.total_count || 0}`)
      console.log(`🔍 Source: ${data.metadata?.source || 'unknown'}`)
      console.log(`💾 Database: ${data.metadata?.database || 'unknown'}`)
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
            if (item.variant_id) {
              console.log(`      Variant ID: ${item.variant_id}`)
            }
          })
        }

        if (order.shipping_address) {
          console.log('\n📍 Shipping Address:')
          const addr = order.shipping_address
          console.log(`   ${addr.first_name} ${addr.last_name}`)
          console.log(`   ${addr.address_1}`)
          if (addr.address_2) console.log(`   ${addr.address_2}`)
          console.log(`   ${addr.city}, ${addr.province} ${addr.postal_code}`)
          console.log(`   ${addr.country_code}`)
        }

        return {
          success: true,
          orders_found: data.data.orders.length,
          total_in_db: data.data.total_count,
          working_endpoint: '/api/store/orders-by-email',
          method: 'direct_database_query'
        }
      } else {
        console.log('\n⚠️ No orders found for this email')
        console.log('💡 This could mean:')
        console.log('   - Customer has not placed any orders yet')
        console.log('   - Email address might be different in database')
        console.log('   - Orders might be stored with different email format')

        return {
          success: true,
          orders_found: 0,
          note: 'Direct database access works but no orders found'
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
testDirectOrdersAPI().then(result => {
  console.log('\n' + '='.repeat(60))
  if (result.success) {
    console.log('🎉 DIRECT DATABASE TEST COMPLETED SUCCESSFULLY!')
    if (result.orders_found > 0) {
      console.log(`📦 Found ${result.orders_found} orders in database`)
      console.log(`📊 Total orders for user: ${result.total_in_db}`)
      console.log('✅ Direct database orders API is working correctly!')
      console.log('🎯 This bypasses Medusa v2 serialization issues completely')
    } else {
      console.log('✅ Database access works, but no orders found')
      console.log('🔍 Orders may exist but with different email address')
    }
  } else {
    console.log('❌ DIRECT DATABASE TEST FAILED!')
    console.log(`Error: ${result.error}`)
    console.log('🔧 Check database connection and table structure')
  }
  console.log('='.repeat(60))
}).catch(error => {
  console.error('Script error:', error)
})