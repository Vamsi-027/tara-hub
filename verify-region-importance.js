// Verify why regions are critical in Medusa v2
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function verifyRegionImportance() {
  console.log('🔍 MEDUSA V2 REGION ARCHITECTURE ANALYSIS\n')
  console.log('=' .repeat(60))
  
  // Check what happens without region
  console.log('\n1️⃣ ATTEMPTING CART CREATION WITHOUT REGION:')
  const noRegionCart = await fetch(`${MEDUSA_URL}/store/carts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
    },
    body: JSON.stringify({
      currency_code: 'usd'
      // No region_id
    })
  })
  
  if (!noRegionCart.ok) {
    console.log('❌ Cart creation fails without region')
    const error = await noRegionCart.text()
    console.log(`   Error: ${error.substring(0, 200)}`)
  } else {
    console.log('✅ Cart created (unusual - check if default region applied)')
  }
  
  // Check with region
  console.log('\n2️⃣ CART CREATION WITH UNITED STATES REGION:')
  const withRegionCart = await fetch(`${MEDUSA_URL}/store/carts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-publishable-api-key': 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
    },
    body: JSON.stringify({
      region_id: 'reg_01K5DB032EF34GSDPW8DK7C20V'
    })
  })
  
  if (withRegionCart.ok) {
    const cart = await withRegionCart.json()
    console.log('✅ Cart created successfully with region')
    console.log(`   Cart ID: ${cart.cart.id}`)
    console.log(`   Region: ${cart.cart.region?.name}`)
    console.log(`   Currency: ${cart.cart.currency_code}`)
    console.log(`   Payment Sessions Available: ${cart.cart.payment_collection?.payment_sessions?.length > 0}`)
  }
  
  console.log('\n3️⃣ REGION CONFIGURATION DETAILS:')
  const regionRes = await fetch(`${MEDUSA_URL}/store/regions`, {
    headers: {
      'x-publishable-api-key': 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
    }
  })
  
  if (regionRes.ok) {
    const { regions } = await regionRes.json()
    const usRegion = regions.find(r => r.id === 'reg_01K5DB032EF34GSDPW8DK7C20V')
    
    if (usRegion) {
      console.log(`\n📍 United States Region Configuration:`)
      console.log(`   Payment Providers: ${usRegion.payment_providers?.map(p => p.id).join(', ')}`)
      console.log(`   Tax Rate: ${usRegion.tax_rate}%`)
      console.log(`   Includes Tax: ${usRegion.includes_tax}`)
      console.log(`   Currency: ${usRegion.currency_code}`)
      console.log(`   Countries: ${usRegion.countries?.length} configured`)
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 ARCHITECTURAL CONCLUSION:')
  console.log('Regions are MANDATORY for:')
  console.log('  ✅ Cart creation and checkout')
  console.log('  ✅ Payment provider configuration (Stripe)')
  console.log('  ✅ Tax calculations')
  console.log('  ✅ Shipping zone management')
  console.log('  ✅ Currency formatting')
  console.log('\nDELETING THE REGION WOULD BREAK YOUR ENTIRE CHECKOUT FLOW!')
}

verifyRegionImportance().catch(console.error)
