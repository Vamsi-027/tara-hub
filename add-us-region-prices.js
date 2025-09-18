// Add United States region prices to products
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const REGION_ID = 'reg_01K5DB032EF34GSDPW8DK7C20V' // United States region

async function addUSRegionPrices() {
  console.log('💰 ADDING UNITED STATES REGION PRICES\n')
  console.log('=' .repeat(60))

  // Get admin token
  const loginRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'admin@tara-hub.com',
      password: 'supersecretpassword'
    })
  })

  if (!loginRes.ok) {
    console.log('❌ Failed to login as admin')
    return
  }

  const { token } = await loginRes.json()
  console.log('✅ Admin authenticated\n')

  // Define prices for Sandwell Lipstick variants
  const pricesToAdd = [
    {
      variantId: 'variant_01K5DHGGTNWQ79CC0658ZW9MR9', // Fabric Per Yard
      title: 'Fabric Per Yard',
      amount: 39900, // $3.99 in cents (multiplied by 100)
      currency: 'usd'
    },
    {
      variantId: 'variant_01K5DHGGTNECAHXF6AS2EM2ECN', // Swatch Sample
      title: 'Swatch Sample',
      amount: 400, // $0.04 in cents (multiplied by 100)
      currency: 'usd'
    }
  ]

  console.log('Adding prices for United States region:\n')

  for (const price of pricesToAdd) {
    console.log(`📦 ${price.title}`)
    console.log(`   Amount: $${(price.amount / 100).toFixed(2)} USD`)
    console.log(`   Variant ID: ${price.variantId}`)

    try {
      // Add price for United States region
      const response = await fetch(`${MEDUSA_URL}/admin/products/variants/${price.variantId}/prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: price.amount,
          currency_code: price.currency,
          region_id: REGION_ID,
          min_quantity: 1
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`   ✅ Price added successfully!`)
        console.log(`   Price ID: ${result.product_variant?.prices?.[0]?.id || 'check admin'}\n`)
      } else {
        const error = await response.text()
        console.log(`   ❌ Failed to add price`)
        console.log(`   Error: ${error.substring(0, 200)}\n`)

        // Try alternative endpoint
        console.log('   Trying alternative method...')

        const altResponse = await fetch(`${MEDUSA_URL}/admin/price-lists/prices`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prices: [{
              amount: price.amount,
              currency_code: price.currency,
              variant_id: price.variantId,
              region_id: REGION_ID,
              min_quantity: 1
            }]
          })
        })

        if (altResponse.ok) {
          console.log(`   ✅ Price added via alternative method!\n`)
        } else {
          console.log(`   ❌ Alternative method also failed\n`)
        }
      }
    } catch (err) {
      console.error(`   Error: ${err.message}\n`)
    }
  }

  console.log('=' .repeat(60))
  console.log('✅ Price addition complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Verify prices in Medusa admin')
  console.log('2. Check fabric-store to see if prices are showing')
  console.log('3. If prices still not showing, may need to clear cache')
}

addUSRegionPrices().catch(console.error)