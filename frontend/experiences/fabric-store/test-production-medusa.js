// Test creating order in production Medusa
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
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
    
    // 3. Check if products/variants exist
    const productsRes = await fetch(`${MEDUSA_URL}/store/products`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    const { products } = await productsRes.json()
    console.log('Products available:', products?.length || 0)
    
    if (products && products.length > 0) {
      console.log('First product:', products[0].id)
      console.log('Variants:', products[0].variants?.map(v => v.id))
      
      // Try adding first variant
      if (products[0].variants && products[0].variants.length > 0) {
        const variantId = products[0].variants[0].id
        const itemRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/line-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': KEY
          },
          body: JSON.stringify({
            variant_id: variantId,
            quantity: 1
          })
        })
        
        if (itemRes.ok) {
          console.log('✅ Item added to cart')
        } else {
          console.log('Failed to add item:', await itemRes.text())
        }
      }
    } else {
      console.log('⚠️ No products found in Medusa. Need to add products first!')
    }
    
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
    
    if (addrRes.ok) {
      console.log('✅ Address added')
    } else {
      console.log('Failed to add address:', await addrRes.text())
    }
    
    // 5. Check payment sessions
    const paymentRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/payment-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      }
    })
    
    if (paymentRes.ok) {
      const updated = await paymentRes.json()
      console.log('Payment sessions:', updated.cart.payment_sessions?.length || 0)
      if (updated.cart.payment_sessions?.length > 0) {
        console.log('Available providers:', updated.cart.payment_sessions.map(s => s.provider_id))
      }
    } else {
      console.log('Failed to create payment sessions:', await paymentRes.text())
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

test()
