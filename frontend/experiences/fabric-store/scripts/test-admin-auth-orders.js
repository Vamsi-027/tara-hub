/**
 * Test Admin Authentication and Orders Retrieval
 * Use Medusa admin credentials to get orders
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const ADMIN_EMAIL = 'admin@tara-hub.com'
const ADMIN_PASSWORD = 'supersecretpassword'
const TEST_EMAIL = 'vamsicheruku027@gmail.com'

async function testAdminAuthAndOrders() {
  console.log('🔑 Testing Admin Authentication and Orders Retrieval')
  console.log('🌐 Medusa Backend:', MEDUSA_BACKEND_URL)
  console.log('👤 Admin Email:', ADMIN_EMAIL)
  console.log('')

  try {
    // Step 1: Authenticate with admin credentials
    console.log('1️⃣ Authenticating with admin credentials...')

    const authResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      console.error('❌ Admin authentication failed:', errorText)
      return null
    }

    const authData = await authResponse.json()
    const adminToken = authData.access_token || authData.token

    if (!adminToken) {
      console.error('❌ No admin token received:', authData)
      return null
    }

    console.log('✅ Admin authentication successful')
    console.log(`🎫 Token: ${adminToken.substring(0, 20)}...`)

    // Step 2: Test orders retrieval with admin token
    console.log('\n2️⃣ Fetching orders with admin token...')

    const orderMethods = [
      {
        name: 'All orders',
        endpoint: '/admin/orders',
        params: ''
      },
      {
        name: 'Orders with email filter',
        endpoint: '/admin/orders',
        params: `?email=${encodeURIComponent(TEST_EMAIL)}`
      },
      {
        name: 'Orders with email in fields',
        endpoint: '/admin/orders',
        params: `?fields=id,email,total,status,created_at&email=${encodeURIComponent(TEST_EMAIL)}`
      },
      {
        name: 'Orders with expand',
        endpoint: '/admin/orders',
        params: `?expand=items,customer&email=${encodeURIComponent(TEST_EMAIL)}`
      }
    ]

    for (const method of orderMethods) {
      console.log(`\n📋 Testing: ${method.name}`)
      console.log(`   URL: ${method.endpoint}${method.params}`)

      try {
        const ordersResponse = await fetch(`${MEDUSA_BACKEND_URL}${method.endpoint}${method.params}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          }
        })

        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          const orders = ordersData.orders || ordersData.data || []

          console.log(`   ✅ Status: ${ordersResponse.status} OK`)
          console.log(`   📦 Orders found: ${orders.length}`)

          if (ordersData.count !== undefined) {
            console.log(`   📊 Total count: ${ordersData.count}`)
          }

          if (orders.length > 0) {
            console.log(`   🎯 ORDERS FOUND! Sample order:`)
            const sampleOrder = orders[0]
            console.log(`      - ID: ${sampleOrder.id}`)
            console.log(`      - Display ID: ${sampleOrder.display_id}`)
            console.log(`      - Email: ${sampleOrder.email}`)
            console.log(`      - Status: ${sampleOrder.status}`)
            console.log(`      - Payment Status: ${sampleOrder.payment_status}`)
            console.log(`      - Total: ${sampleOrder.total}`)
            console.log(`      - Currency: ${sampleOrder.currency_code}`)
            console.log(`      - Created: ${sampleOrder.created_at}`)

            // Check for the specific email
            const matchingOrders = orders.filter(order => order.email === TEST_EMAIL)
            console.log(`   🎯 Orders matching "${TEST_EMAIL}": ${matchingOrders.length}`)

            if (matchingOrders.length > 0) {
              console.log(`   🎉 FOUND MATCHING ORDERS!`)
              matchingOrders.forEach((order, index) => {
                console.log(`      Order ${index + 1}:`)
                console.log(`        - ID: ${order.id}`)
                console.log(`        - Display ID: ${order.display_id}`)
                console.log(`        - Total: ${order.total}`)
                console.log(`        - Items: ${order.items?.length || 'N/A'}`)
              })

              return {
                success: true,
                working_method: method,
                admin_token: adminToken,
                orders_found: matchingOrders.length,
                sample_order: matchingOrders[0],
                all_orders: matchingOrders
              }
            }
          }
        } else {
          console.log(`   ❌ Status: ${ordersResponse.status}`)
          const errorText = await ordersResponse.text()
          if (errorText && !errorText.includes('<!DOCTYPE html>')) {
            console.log(`   💬 Error: ${errorText.substring(0, 150)}`)
          }
        }
      } catch (error) {
        console.log(`   💥 Error: ${error.message}`)
      }
    }

    console.log(`\n✅ Admin authentication works, but no orders found for ${TEST_EMAIL}`)
    return {
      success: true,
      admin_token: adminToken,
      orders_found: 0,
      note: 'Admin auth works but no matching orders'
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    return null
  }
}

// Run the test
testAdminAuthAndOrders().then(result => {
  if (result && result.success) {
    console.log(`\n🎉 SUCCESS: Admin authentication working!`)
    if (result.orders_found > 0) {
      console.log(`📦 Found ${result.orders_found} orders for the user`)
      console.log(`🔧 Can now implement secure orders API with admin auth`)
    } else {
      console.log(`🔍 Admin auth works but no orders found - check email spelling or order creation`)
    }
  } else {
    console.log(`\n❌ FAILED: Could not authenticate or retrieve orders`)
  }
}).catch(error => {
  console.error('Script failed:', error)
})