// Comprehensive Medusa Order System Diagnostic
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const FABRIC_STORE_URL = 'https://fabric-store-ten.vercel.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

console.log('🔍 MEDUSA ORDER SYSTEM DIAGNOSTIC')
console.log('=' .repeat(60))
console.log(`Timestamp: ${new Date().toISOString()}\n`)

async function diagnose() {
  let diagnostics = {
    health: false,
    regions: [],
    products: [],
    stripe: false,
    cartCreation: false,
    paymentMethods: [],
    orderCompletion: false,
    issues: []
  }

  try {
    // 1. CHECK HEALTH
    console.log('1️⃣ Checking Medusa Health...')
    const healthRes = await fetch(`${MEDUSA_URL}/health`)
    if (healthRes.ok) {
      console.log('   ✅ Medusa is running')
      diagnostics.health = true
    } else {
      console.log('   ❌ Medusa health check failed')
      diagnostics.issues.push('Medusa health check failed')
    }

    // 2. CHECK REGIONS
    console.log('\n2️⃣ Checking Regions...')
    const regRes = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    
    if (regRes.ok) {
      const { regions } = await regRes.json()
      console.log(`   ✅ Found ${regions.length} region(s)`)
      
      regions.forEach(r => {
        console.log(`   📍 Region: ${r.name} (${r.id})`)
        console.log(`      Currency: ${r.currency_code}`)
        console.log(`      Countries: ${r.countries?.map(c => c.iso_2).join(', ') || 'None'}`)
        console.log(`      Payment Providers: ${r.payment_providers?.map(p => p.id).join(', ') || 'NONE CONFIGURED'}`)
        
        if (!r.payment_providers || r.payment_providers.length === 0) {
          diagnostics.issues.push(`Region ${r.name} has no payment providers`)
        }
        
        diagnostics.regions.push({
          id: r.id,
          name: r.name,
          currency: r.currency_code,
          providers: r.payment_providers?.map(p => p.id) || []
        })
      })
    } else {
      console.log('   ❌ Failed to fetch regions')
      diagnostics.issues.push('Cannot fetch regions')
    }

    // 3. CHECK PRODUCTS
    console.log('\n3️⃣ Checking Products...')
    const prodRes = await fetch(`${MEDUSA_URL}/store/products`, {
      headers: { 'x-publishable-api-key': KEY }
    })
    
    if (prodRes.ok) {
      const { products } = await prodRes.json()
      console.log(`   ✅ Found ${products.length} product(s)`)
      
      if (products.length > 0) {
        const p = products[0]
        console.log(`   📦 Sample Product: ${p.title}`)
        console.log(`      ID: ${p.id}`)
        console.log(`      Variants: ${p.variants?.length || 0}`)
        if (p.variants?.length > 0) {
          console.log(`      First Variant ID: ${p.variants[0].id}`)
        }
        diagnostics.products = products.map(p => ({
          id: p.id,
          title: p.title,
          variants: p.variants?.map(v => v.id) || []
        }))
      } else {
        diagnostics.issues.push('No products in store')
      }
    } else {
      console.log('   ❌ Failed to fetch products')
      diagnostics.issues.push('Cannot fetch products')
    }

    // 4. TEST CART CREATION
    console.log('\n4️⃣ Testing Cart Creation...')
    if (diagnostics.regions.length > 0) {
      const region = diagnostics.regions[0]
      
      const cartRes = await fetch(`${MEDUSA_URL}/store/carts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-publishable-api-key': KEY 
        },
        body: JSON.stringify({
          region_id: region.id,
          email: 'diagnostic@test.com'
        })
      })
      
      if (cartRes.ok) {
        const { cart } = await cartRes.json()
        console.log(`   ✅ Cart created: ${cart.id}`)
        diagnostics.cartCreation = true
        
        // 5. TEST ADDING ITEMS
        console.log('\n5️⃣ Testing Add to Cart...')
        if (diagnostics.products.length > 0 && diagnostics.products[0].variants.length > 0) {
          const variantId = diagnostics.products[0].variants[0]
          
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
            console.log('   ✅ Item added to cart')
          } else {
            console.log('   ❌ Failed to add item')
            diagnostics.issues.push('Cannot add items to cart')
          }
        }
        
        // 6. ADD SHIPPING ADDRESS
        console.log('\n6️⃣ Testing Shipping Address...')
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
              address_1: '123 Test St',
              city: 'New York',
              province: 'NY',
              postal_code: '10001',
              country_code: 'us'
            },
            email: 'test@test.com'
          })
        })
        
        if (addrRes.ok) {
          console.log('   ✅ Address added')
        } else {
          console.log('   ❌ Failed to add address')
          diagnostics.issues.push('Cannot add shipping address')
        }
        
        // 7. CHECK PAYMENT METHODS
        console.log('\n7️⃣ Checking Payment Methods...')
        
        // Try different payment endpoints
        const paymentEndpoints = [
          '/payment-method',
          '/payment-methods', 
          '/payment-session',
          '/payment-sessions',
          '/payment-collections'
        ]
        
        for (const endpoint of paymentEndpoints) {
          const url = `${MEDUSA_URL}/store/carts/${cart.id}${endpoint}`
          const res = await fetch(url, {
            method: endpoint.includes('collection') ? 'GET' : 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': KEY
            },
            body: endpoint.includes('collection') ? undefined : JSON.stringify({
              provider_id: 'stripe'
            })
          })
          
          if (res.status !== 404) {
            console.log(`   📍 Endpoint ${endpoint}: Status ${res.status}`)
            if (res.ok) {
              diagnostics.paymentMethods.push(endpoint)
            }
          }
        }
        
        if (diagnostics.paymentMethods.length === 0) {
          console.log('   ❌ No payment endpoints available')
          diagnostics.issues.push('Payment endpoints not available')
        }
        
        // 8. TEST ORDER COMPLETION
        console.log('\n8️⃣ Testing Order Completion...')
        const completeRes = await fetch(`${MEDUSA_URL}/store/carts/${cart.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': KEY
          }
        })
        
        if (completeRes.ok) {
          const { order } = await completeRes.json()
          console.log(`   ✅ ORDER CREATED: ${order.id}`)
          diagnostics.orderCompletion = true
        } else {
          const error = await completeRes.text()
          console.log('   ❌ Cannot complete order:', error.substring(0, 100))
          diagnostics.issues.push(`Order completion failed: ${error.substring(0, 100)}`)
        }
        
      } else {
        console.log('   ❌ Failed to create cart')
        diagnostics.issues.push('Cannot create cart')
      }
    }

    // 9. CHECK STRIPE CONFIGURATION
    console.log('\n9️⃣ Checking Stripe Configuration...')
    if (diagnostics.regions.length > 0) {
      const hasStripe = diagnostics.regions.some(r => 
        r.providers.includes('stripe') || r.providers.includes('stripe-blik')
      )
      
      if (hasStripe) {
        console.log('   ✅ Stripe is configured in at least one region')
        diagnostics.stripe = true
      } else {
        console.log('   ❌ Stripe not found in any region')
        diagnostics.issues.push('Stripe not configured in regions')
      }
    }

  } catch (err) {
    console.error('\n❌ Diagnostic Error:', err.message)
    diagnostics.issues.push(`Diagnostic error: ${err.message}`)
  }

  // SUMMARY
  console.log('\n' + '=' .repeat(60))
  console.log('📊 DIAGNOSTIC SUMMARY')
  console.log('=' .repeat(60))
  
  console.log('\n✅ Working:')
  if (diagnostics.health) console.log('   • Medusa server is running')
  if (diagnostics.regions.length > 0) console.log('   • Regions configured')
  if (diagnostics.products.length > 0) console.log('   • Products available')
  if (diagnostics.cartCreation) console.log('   • Cart creation works')
  if (diagnostics.stripe) console.log('   • Stripe configured in region')
  if (diagnostics.orderCompletion) console.log('   • Orders can be completed')
  
  console.log('\n❌ Issues Found:')
  if (diagnostics.issues.length === 0) {
    console.log('   • No issues detected')
  } else {
    diagnostics.issues.forEach(issue => {
      console.log(`   • ${issue}`)
    })
  }
  
  console.log('\n🔧 RECOMMENDATIONS:')
  if (!diagnostics.stripe) {
    console.log('   1. Enable Stripe payment provider in Medusa admin')
    console.log('      - Go to Settings > Regions > Edit Region > Payment Providers')
  }
  if (diagnostics.paymentMethods.length === 0) {
    console.log('   2. Payment endpoints missing - Medusa may need Stripe configuration')
    console.log('      - Check STRIPE_API_KEY in Railway environment')
  }
  if (diagnostics.issues.includes('Order completion failed')) {
    console.log('   3. Orders failing - likely due to missing payment provider')
  }
  
  return diagnostics
}

diagnose().then(d => {
  console.log('\n📋 Full diagnostic data saved to diagnostics.json')
  require('fs').writeFileSync('diagnostics.json', JSON.stringify(d, null, 2))
})
