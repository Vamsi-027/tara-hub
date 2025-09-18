// Test Stripe payment configuration in production Medusa
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function testStripePayment() {
  try {
    console.log('🔧 Testing Stripe payment configuration...\n')
    
    // 1. Get region
    const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    const { regions } = await regRes.json()
    const region = regions[0]
    console.log('✅ Region:', region.id, '(' + region.name + ')')
    console.log('   Currency:', region.currency_code)
    console.log('   Payment providers:', region.payment_providers?.map(p => p.id).join(', ') || 'None configured')
    
    // 2. Create cart
    const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY 
      },
      body: JSON.stringify({
        region_id: region.id,
        email: 'test@test.com'
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
        quantity: 1
      })
    })
    
    if (!itemRes.ok) {
      console.log('❌ Failed to add item:', await itemRes.text())
      return
    }
    console.log('✅ Item added to cart')
    
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
        email: 'test@test.com'
      })
    })
    
    if (!addrRes.ok) {
      console.log('❌ Failed to add address:', await addrRes.text())
      return
    }
    console.log('✅ Address added')
    
    // 5. Try to select Stripe payment method
    console.log('\n🔧 Testing Stripe payment method...')
    const paymentRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/payment-method`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': KEY
      },
      body: JSON.stringify({
        provider_id: 'stripe'
      })
    })
    
    if (paymentRes.ok) {
      const result = await paymentRes.json()
      console.log('✅ Stripe payment method selected!')
      
      if (result.cart?.payment_session) {
        console.log('\n💳 Payment session details:')
        console.log('   Provider:', result.cart.payment_session.provider_id)
        console.log('   Status:', result.cart.payment_session.status)
        console.log('   Amount:', result.cart.payment_session.amount)
        
        if (result.cart.payment_session.data?.client_secret) {
          console.log('   ✅ Client secret available for Stripe!')
          console.log('   Client secret:', result.cart.payment_session.data.client_secret.substring(0, 30) + '...')
        }
      }
      
      console.log('\n🎉 SUCCESS! Stripe is properly configured in Medusa!')
      console.log('   Orders can now be completed with payment')
      
    } else {
      const error = await paymentRes.text()
      console.log('❌ Failed to select Stripe payment:', error)
      console.log('\n⚠️ Stripe may not be configured in Medusa backend')
      console.log('   Need to configure Stripe in Medusa admin or environment variables')
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

testStripePayment()
