// Check and potentially fix region payment configuration
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function checkRegionPayments() {
  try {
    // Get region details
    const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    const { regions } = await regRes.json()
    const region = regions[0]
    
    console.log('Region Configuration:')
    console.log('==================')
    console.log('ID:', region.id)
    console.log('Name:', region.name)
    console.log('Currency:', region.currency_code)
    console.log('Countries:', region.countries?.map(c => c.iso_2).join(', '))
    console.log('\nPayment Providers:')
    
    if (region.payment_providers && region.payment_providers.length > 0) {
      region.payment_providers.forEach(provider => {
        console.log('  -', provider.id, '(Active)')
      })
    } else {
      console.log('  ❌ None configured')
      console.log('\n⚠️  ISSUE FOUND: No payment providers enabled for this region')
      console.log('\nTO FIX:')
      console.log('1. Access Medusa Admin: https://medusa-backend-production-3655.up.railway.app/app')
      console.log('2. Go to Settings > Regions')
      console.log('3. Edit the region and enable "Stripe" as a payment provider')
      console.log('4. Save the changes')
      console.log('\nAlternatively, this can be done via API with admin credentials')
    }
    
    // Check if payment endpoints exist
    console.log('\n\nChecking Payment Endpoints:')
    console.log('==========================')
    
    // Test if payment-sessions endpoint exists (Medusa v1 style)
    const testCart = await fetch(`${MEDUSA_URL}/store/carts`, {
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
    const { cart } = await testCart.json()
    
    // Check different payment endpoints
    const endpoints = [
      '/store/carts/' + cart.id + '/payment-sessions',
      '/store/carts/' + cart.id + '/payment-session',
      '/store/carts/' + cart.id + '/payment-method',
      '/store/carts/' + cart.id + '/payment-methods'
    ]
    
    for (const endpoint of endpoints) {
      const res = await fetch(MEDUSA_URL + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': KEY
        },
        body: JSON.stringify({ provider_id: 'stripe' })
      })
      
      if (res.ok || res.status === 400) { // 400 might mean the endpoint exists but requires different params
        console.log('✅', endpoint, '- Endpoint exists')
      } else if (res.status === 404) {
        console.log('❌', endpoint, '- Not found')
      } else {
        console.log('⚠️', endpoint, '- Status:', res.status)
      }
    }
    
  } catch (err) {
    console.error('Error:', err)
  }
}

checkRegionPayments()
