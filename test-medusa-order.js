// Test creating an order directly in Medusa
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function createMedusaOrder() {
  console.log('🚀 CREATING ORDER DIRECTLY IN MEDUSA')
  console.log('=' .repeat(60))

  try {
    // Step 1: Create cart
    console.log('\n1️⃣ Creating cart...')
    const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        region_id: 'reg_01K5DB032EF34GSDPW8DK7C20V',
        email: 'direct@test.com'
      })
    })

    if (!cartRes.ok) {
      console.log('❌ Failed to create cart')
      return
    }

    const { cart } = await cartRes.json()
    console.log('✅ Cart created:', cart.id)

    // Step 2: Add item
    console.log('\n2️⃣ Adding item to cart...')
    const itemRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        variant_id: 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',
        quantity: 2
      })
    })

    if (itemRes.ok) {
      console.log('✅ Item added to cart')
    } else {
      console.log('❌ Failed to add item:', itemRes.status)
      const error = await itemRes.text()
      console.log('   Error:', error.substring(0, 200))
    }

    // Step 3: Add shipping address
    console.log('\n3️⃣ Adding shipping address...')
    const addrRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        shipping_address: {
          first_name: 'Direct',
          last_name: 'Test',
          address_1: '123 Direct St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
          phone: '555-0123'
        },
        billing_address: {
          first_name: 'Direct',
          last_name: 'Test',
          address_1: '123 Direct St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us'
        },
        email: 'direct@test.com'
      })
    })

    if (addrRes.ok) {
      console.log('✅ Address added')
    } else {
      console.log('❌ Failed to add address:', addrRes.status)
      const error = await addrRes.text()
      console.log('   Error:', error.substring(0, 200))
    }

    // Step 4: Complete cart to create order
    console.log('\n4️⃣ Completing cart to create order...')
    const completeRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      }
    })

    if (completeRes.ok) {
      const result = await completeRes.json()
      const orderId = result.order?.id || result.data?.id || result.id

      console.log('\n' + '=' .repeat(60))
      console.log('🎉 ORDER CREATED SUCCESSFULLY IN MEDUSA!')
      console.log('📦 Order ID:', orderId)
      console.log('💾 This order IS stored in the Medusa database')
      console.log('👁️ Check Medusa admin to see this order')
      console.log('=' .repeat(60))

      return orderId
    } else {
      const error = await completeRes.text()
      console.log('❌ Failed to complete order:', error.substring(0, 200))
    }

  } catch (err) {
    console.error('Error:', err.message)
  }
}

createMedusaOrder()