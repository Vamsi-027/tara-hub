// Verify orders in Medusa database
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function verifyOrders() {
  console.log('🔍 VERIFYING ORDERS IN MEDUSA DATABASE')
  console.log('=' .repeat(60))

  try {
    // First, get admin token
    console.log('1️⃣ Authenticating as admin...')
    const loginRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tara-hub.com',
        password: 'supersecretpassword'
      })
    })

    if (!loginRes.ok) {
      console.log('❌ Failed to authenticate as admin')
      console.log('   Status:', loginRes.status)
      const error = await loginRes.text()
      console.log('   Response:', error.substring(0, 200))
      return
    }

    const { token } = await loginRes.json()
    console.log('✅ Admin authentication successful')

    // Get orders list
    console.log('\n2️⃣ Fetching orders from admin API...')
    const ordersRes = await fetch(`${MEDUSA_URL}/admin/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!ordersRes.ok) {
      console.log('❌ Failed to fetch orders')
      console.log('   Status:', ordersRes.status)
      return
    }

    const { orders } = await ordersRes.json()
    console.log(`\n✅ Found ${orders.length} order(s) in database`)

    if (orders.length > 0) {
      console.log('\n📦 Recent Orders:')
      orders.slice(0, 5).forEach(order => {
        console.log(`\n   Order ID: ${order.id}`)
        console.log(`   Display ID: ${order.display_id}`)
        console.log(`   Email: ${order.email}`)
        console.log(`   Status: ${order.status}`)
        console.log(`   Payment Status: ${order.payment_status}`)
        console.log(`   Total: ${order.currency_code} ${(order.total / 100).toFixed(2)}`)
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`)
        if (order.items && order.items.length > 0) {
          console.log(`   Items: ${order.items.length}`)
          order.items.forEach(item => {
            console.log(`      - ${item.title} x${item.quantity}`)
          })
        }
      })
    } else {
      console.log('\n⚠️ No orders found in database')
    }

    // Check for specific test order
    console.log('\n3️⃣ Checking for recent test orders...')
    const recentTestOrder = orders.find(o =>
      o.email === 'test@example.com' ||
      o.email === 'test@test.com' ||
      o.email === 'diagnostic@test.com'
    )

    if (recentTestOrder) {
      console.log('✅ Found test order:', recentTestOrder.id)
      console.log('   This confirms orders are being stored in Medusa database!')
    }

  } catch (err) {
    console.error('Error:', err.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Verification complete')
}

verifyOrders()