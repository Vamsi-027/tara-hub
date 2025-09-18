// Test creating a complete order with Stripe payment
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function testStripeOrder() {
  try {
    console.log('🎯 Testing Complete Order Flow with Stripe Payment\n')
    console.log('=' .repeat(50))
    
    // 1. Get region
    const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    const { regions } = await regRes.json()
    const region = regions[0]
    console.log('\n✅ Region:', region.id)
    console.log('   Name:', region.name)
    console.log('   Payment providers:', region.payment_providers?.map(p => p.id).join(', ') || 'None')
    
    // 2. Create cart
    const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY 
      },
      body: JSON.stringify({
        region_id: region.id,
        email: 'test@example.com'
      })
    })
    const { cart } = await cartRes.json()
    console.log('\n✅ Cart created:', cart.id)
    
    // 3. Add item
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
    
    if (!itemRes.ok) {
      console.log('❌ Failed to add item:', await itemRes.text())
      return
    }
    console.log('✅ Item added (2 yards)')
    
    // 4. Add addresses
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
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
          phone: '555-0123'
        },
        billing_address: {
          first_name: 'Test',
          last_name: 'User',
          address_1: '123 Main St',
          city: 'New York',
          province: 'NY',
          postal_code: '10001',
          country_code: 'us',
          phone: '555-0123'
        },
        email: 'test@example.com'
      })
    })
    
    if (!addrRes.ok) {
      console.log('❌ Failed to add address:', await addrRes.text())
      return
    }
    console.log('✅ Addresses added')
    
    // 5. Try different payment endpoints (Medusa v2 might use different ones)
    console.log('\n🔧 Testing payment initialization...')
    
    const paymentEndpoints = [
      { endpoint: '/payment-method', body: { provider_id: 'stripe' } },
      { endpoint: '/payment-methods', body: { provider_id: 'stripe' } },
      { endpoint: '/payment-session', body: { provider_id: 'stripe' } },
      { endpoint: '/payment-sessions', body: {} }
    ]
    
    let paymentInitialized = false
    let paymentSession = null
    
    for (const { endpoint, body } of paymentEndpoints) {
      const paymentRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': KEY
        },
        body: JSON.stringify(body)
      })
      
      if (paymentRes.ok) {
        const result = await paymentRes.json()
        console.log(`✅ Payment initialized via ${endpoint}`)
        paymentInitialized = true
        paymentSession = result.cart?.payment_session || result.payment_session
        break
      } else if (paymentRes.status === 404) {
        console.log(`   ${endpoint} - Not found`)
      } else {
        const errorText = await paymentRes.text()
        console.log(`   ${endpoint} - Error:`, errorText.substring(0, 100))
      }
    }
    
    if (paymentInitialized && paymentSession) {
      console.log('\n💳 Payment Session Details:')
      console.log('   Provider:', paymentSession.provider_id)
      console.log('   Status:', paymentSession.status)
      console.log('   Amount:', paymentSession.amount)
      
      if (paymentSession.data?.client_secret) {
        console.log('   ✅ Stripe client secret available!')
        console.log('   Client secret:', paymentSession.data.client_secret.substring(0, 30) + '...')
      }
    }
    
    // 6. Try to complete the order
    console.log('\n🚀 Attempting to complete order...')
    const completeRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      }
    })
    
    if (completeRes.ok) {
      const result = await completeRes.json()
      console.log('\n' + '🎉'.repeat(10))
      console.log('SUCCESS! Order completed in Medusa!')
      console.log('Order ID:', result.order?.id || result.id)
      console.log('This order is now in the Medusa database!')
      console.log('🎉'.repeat(10))
    } else {
      const error = await completeRes.text()
      console.log('\n❌ Could not complete order:', error.substring(0, 200))
      
      if (error.includes('payment')) {
        console.log('\n📝 Note: Payment needs to be confirmed with Stripe before completion')
        console.log('   In production, use Stripe.js to confirm payment with the client secret')
      }
    }
    
    console.log('\n📍 Cart Details:')
    console.log('   Cart ID:', cart.id)
    console.log('   View in admin: https://medusa-backend-production-3655.up.railway.app/app/orders/carts/' + cart.id)
    
  } catch (err) {
    console.error('Error:', err.message)
  }
}

testStripeOrder()
