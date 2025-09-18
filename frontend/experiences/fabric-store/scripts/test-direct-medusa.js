// Test creating order directly in local Medusa
const MEDUSA_URL = 'http://localhost:9000'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function test() {
  try {
    // 1. Get region
    const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    const { regions } = await regRes.json()
    console.log('Region:', regions[0].id)
    
    // 2. Create cart
    const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY 
      },
      body: JSON.stringify({
        region_id: regions[0].id,
        email: 'test@test.com'
      })
    })
    const { cart } = await cartRes.json()
    console.log('Cart ID:', cart.id)
    
    // 3. Add item with VARIANT ID
    const itemRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/line-items`, {
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
    
    if (!itemRes.ok) {
      console.log('Failed to add item:', await itemRes.text())
      return
    }
    
    console.log('✅ Item added to cart')
    
    // 4. Add address
    const addrRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        shipping_address: {
          first_name: 'Test',
          last_name: 'User',
          address_1: '123 Main St',
          city: 'St Louis',
          province: 'MO',
          postal_code: '63146',
          country_code: 'us'
        },
        email: 'test@test.com'
      })
    })
    
    if (!addrRes.ok) {
      console.log('Failed to add address:', await addrRes.text())
      return
    }
    
    console.log('✅ Address added')
    
    // 5. Try to complete
    const completeRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      }
    })
    
    if (!completeRes.ok) {
      const error = await completeRes.text()
      console.log('❌ Complete failed:', error)
      
      // This is expected - we need payment
      // For now, the cart is created and can be viewed
      console.log('\n📍 Cart created but needs payment to complete')
      console.log('Cart ID:', cart.id)
      console.log('This proves Medusa connection is working!')
    } else {
      const { order } = await completeRes.json()
      console.log('🎉 Order created:', order.id)
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

test()
