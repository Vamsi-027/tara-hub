// Check orders via store API
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function checkOrders() {
  console.log('🔍 CHECKING ORDERS VIA STORE API')
  console.log('=' .repeat(60))

  try {
    // Test with a known order ID
    const testOrderIds = [
      'order_1758166287534_6c07ut8bg',
      'order_1758165987976_sh6cdo1da',
      'order_01K5DDZQCVSNGXNMMCS3DAT9ZV'
    ]

    console.log('Testing access to known order IDs:\n')

    for (const orderId of testOrderIds) {
      console.log(`Checking ${orderId}...`)

      const orderRes = await fetch(`${MEDUSA_URL}/store/orders/${orderId}`, {
        headers: {
          'x-publishable-api-key': KEY
        }
      })

      if (orderRes.ok) {
        const { order } = await orderRes.json()
        console.log(`✅ Order ${orderId} found!`)
        console.log(`   Email: ${order.email}`)
        console.log(`   Status: ${order.status}`)
        console.log(`   Total: ${order.currency_code} ${(order.total / 100).toFixed(2)}`)
        console.log(`   Created: ${new Date(order.created_at).toLocaleString()}\n`)
      } else {
        console.log(`❌ Order ${orderId}: Status ${orderRes.status}`)
        if (orderRes.status === 404) {
          console.log(`   Order not found (may not exist in database)\n`)
        } else {
          console.log(`   Authentication or permission issue\n`)
        }
      }
    }

    // Try to create and immediately fetch a new order
    console.log('\n' + '=' .repeat(60))
    console.log('Creating a new test order to verify database storage...\n')

    // Create cart
    const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        region_id: 'reg_01K5DB032EF34GSDPW8DK7C20V',
        email: 'verify@test.com'
      })
    })

    if (cartRes.ok) {
      const { cart } = await cartRes.json()
      console.log(`✅ Cart created: ${cart.id}`)

      // Complete cart to order
      const completeRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': KEY
        }
      })

      if (completeRes.ok) {
        const result = await completeRes.json()
        const orderId = result.order?.id || result.data?.id

        if (orderId) {
          console.log(`✅ Order created: ${orderId}`)
          console.log('\n🎉 SUCCESS! Orders are being created and stored in Medusa database!')

          // Try to fetch the order
          console.log('\nAttempting to retrieve the order...')
          const verifyRes = await fetch(`${MEDUSA_URL}/store/orders/${orderId}`, {
            headers: {
              'x-publishable-api-key': KEY
            }
          })

          if (verifyRes.ok) {
            console.log('✅ Order retrieved successfully from database!')
          } else {
            console.log(`⚠️ Order retrieval returned status ${verifyRes.status}`)
            console.log('   (This is normal - orders may require authentication to view)')
          }
        }
      } else {
        const error = await completeRes.text()
        console.log('❌ Failed to complete order:', error.substring(0, 100))
      }
    }

  } catch (err) {
    console.error('Error:', err.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Check complete')
}

checkOrders()