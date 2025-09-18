// Try to complete order in production Medusa
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function test() {
  try {
    // 1. Create a complete cart
    const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    const { regions } = await regRes.json()
    
    const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY 
      },
      body: JSON.stringify({
        region_id: regions[0].id,
        email: 'test@example.com'
      })
    })
    const { cart } = await cartRes.json()
    console.log('Cart created:', cart.id)
    
    // 2. Add item
    await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/line-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        variant_id: 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',
        quantity: 1
      })
    })
    console.log('Item added')
    
    // 3. Add complete address
    await fetch(`${MEDUSA_URL}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address_1: '123 Test St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
          phone: '555-0123'
        },
        billing_address: {
          first_name: 'Test',
          last_name: 'User',
          address_1: '123 Test St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
          phone: '555-0123'
        },
        email: 'test@example.com'
      })
    })
    console.log('Address added')
    
    // 4. Try to complete the cart
    const completeRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      }
    })
    
    if (completeRes.ok) {
      const result = await completeRes.json()
      console.log('🎉 SUCCESS! Order created:', result.order?.id || result.id)
      console.log('Order is now in Medusa database!')
    } else {
      const error = await completeRes.text()
      console.log('❌ Complete failed:', error)
      
      // The cart is still created and can be viewed in admin
      console.log('\n📍 Cart created in Medusa:', cart.id)
      console.log('This cart is visible in the Medusa admin even if not completed')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

test()
