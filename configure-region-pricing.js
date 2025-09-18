// Configure United States region with proper payment providers and pricing
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function configureRegionPricing() {
  console.log('🔧 CONFIGURING UNITED STATES REGION PRICING\n')
  console.log('=' .repeat(60))

  // Login as admin
  console.log('1️⃣ Logging in as admin...')
  const loginRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@tara-hub.com',
      password: 'password'
    })
  })

  if (!loginRes.ok) {
    console.log('❌ Failed to login as admin')
    return
  }

  const { token } = await loginRes.json()
  console.log('✅ Admin authenticated')

  const regionId = 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ'

  // Check current region configuration
  console.log('\n2️⃣ Checking current region configuration...')
  const regionRes = await fetch(`${MEDUSA_URL}/admin/regions/${regionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (regionRes.ok) {
    const { region } = await regionRes.json()
    console.log(`Region: ${region.name}`)
    console.log(`Currency: ${region.currency_code}`)
    console.log(`Countries: ${region.countries?.map(c => c.display_name).join(', ')}`)
    console.log(`Payment Providers: ${region.payment_providers?.map(p => p.id).join(', ') || 'None'}`)
    console.log(`Fulfillment Providers: ${region.fulfillment_providers?.map(f => f.id).join(', ') || 'None'}`)
  }

  // Add Stripe payment provider to the region
  console.log('\n3️⃣ Adding Stripe payment provider to region...')
  const addStripeRes = await fetch(`${MEDUSA_URL}/admin/regions/${regionId}/payment-providers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider_id: 'stripe'
    })
  })

  if (addStripeRes.ok) {
    console.log('✅ Stripe payment provider added to region')
  } else {
    const error = await addStripeRes.text()
    console.log(`⚠️ Stripe provider: ${error}`)
  }

  // Add manual fulfillment provider
  console.log('\n4️⃣ Adding fulfillment provider to region...')
  const addFulfillmentRes = await fetch(`${MEDUSA_URL}/admin/regions/${regionId}/fulfillment-providers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      provider_id: 'manual'
    })
  })

  if (addFulfillmentRes.ok) {
    console.log('✅ Manual fulfillment provider added to region')
  } else {
    const error = await addFulfillmentRes.text()
    console.log(`⚠️ Fulfillment provider: ${error}`)
  }

  // Check if there are any existing products to add prices to
  console.log('\n5️⃣ Checking for existing products...')
  const productsRes = await fetch(`${MEDUSA_URL}/admin/products?limit=10`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (productsRes.ok) {
    const { products } = await productsRes.json()
    console.log(`Found ${products.length} products`)

    if (products.length > 0) {
      console.log('\n6️⃣ Products found - you can add prices in admin:')
      products.forEach(product => {
        console.log(`  - ${product.title} (${product.id})`)
        product.variants?.forEach(variant => {
          console.log(`    └── ${variant.title} (${variant.id})`)
          const hasPrices = variant.prices && variant.prices.length > 0
          console.log(`        Prices: ${hasPrices ? variant.prices.length + ' configured' : 'None'}`)
        })
      })
    } else {
      console.log('No products found. You need to create products first.')
    }
  }

  // Verify final region configuration
  console.log('\n7️⃣ Final region configuration:')
  const finalRegionRes = await fetch(`${MEDUSA_URL}/admin/regions/${regionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (finalRegionRes.ok) {
    const { region } = await finalRegionRes.json()
    console.log(`✅ Region: ${region.name}`)
    console.log(`✅ Currency: ${region.currency_code}`)
    console.log(`✅ Payment Providers: ${region.payment_providers?.map(p => p.id).join(', ') || 'None'}`)
    console.log(`✅ Fulfillment Providers: ${region.fulfillment_providers?.map(f => f.id).join(', ') || 'None'}`)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Region configuration complete!')
  console.log('\n📝 NEXT STEPS:')
  console.log('1. Create products in Medusa Admin')
  console.log('2. When setting prices, select "United States" region')
  console.log('3. The pricing component should now show "United States" instead of "USD"')
  console.log('4. Make sure to publish products after creating them')
}

configureRegionPricing().catch(console.error)