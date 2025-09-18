// Final fix - Delete ALL prices and add only United States region prices
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const REGION_ID = 'reg_01K5DB032EF34GSDPW8DK7C20V' // United States region

async function finalFixPrices() {
  console.log('🎯 FINAL PRICE FIX - UNITED STATES REGION ONLY\n')
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

  const productId = 'prod_01K5DHGG4JGAZ24B9XW5J47JK2'

  // Step 1: Delete ALL existing prices
  console.log('1️⃣ DELETING ALL EXISTING PRICES')
  console.log('-' .repeat(40))

  const productRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (productRes.ok) {
    const { product } = await productRes.json()

    for (const variant of product.variants || []) {
      console.log(`\n${variant.title}:`)

      if (variant.prices && variant.prices.length > 0) {
        for (const price of variant.prices) {
          console.log(`  Deleting: ${price.currency_code} $${(price.amount/100).toFixed(2)}`)

          try {
            // Try multiple delete endpoints
            const endpoints = [
              `${MEDUSA_URL}/admin/products/variants/${variant.id}/prices/${price.id}`,
              `${MEDUSA_URL}/admin/prices/${price.id}`,
              `${MEDUSA_URL}/admin/products/${productId}/variants/${variant.id}/prices/${price.id}`
            ]

            let deleted = false
            for (const endpoint of endpoints) {
              const deleteRes = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })

              if (deleteRes.ok || deleteRes.status === 404) {
                console.log(`    ✅ Deleted`)
                deleted = true
                break
              }
            }

            if (!deleted) {
              console.log(`    ⚠️ Could not delete`)
            }
          } catch (err) {
            console.log(`    ❌ Error: ${err.message}`)
          }
        }
      } else {
        console.log(`  No prices to delete`)
      }
    }
  }

  // Step 2: Wait a moment for deletions to process
  console.log('\n⏳ Waiting for deletions to process...')
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Step 3: Add correct prices for United States region
  console.log('\n2️⃣ ADDING CORRECT UNITED STATES REGION PRICES')
  console.log('-' .repeat(40))

  const correctPrices = [
    {
      variantId: 'variant_01K5DHGGTNWQ79CC0658ZW9MR9',
      title: 'Fabric Per Yard',
      amount: 39900 // $399.00
    },
    {
      variantId: 'variant_01K5DHGGTNECAHXF6AS2EM2ECN',
      title: 'Swatch Sample',
      amount: 400 // $4.00
    }
  ]

  for (const item of correctPrices) {
    console.log(`\n${item.title}:`)
    console.log(`  Target price: $${(item.amount/100).toFixed(2)}`)

    try {
      // Method 1: Update variant with prices array including region_id
      const updateRes = await fetch(
        `${MEDUSA_URL}/admin/products/${productId}/variants/${item.variantId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prices: [{
              amount: item.amount,
              currency_code: 'usd',
              region_id: REGION_ID
            }]
          })
        }
      )

      if (updateRes.ok) {
        console.log(`  ✅ Price added successfully!`)
      } else {
        const error = await updateRes.text()
        console.log(`  ❌ Failed: ${error.substring(0, 100)}`)
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`)
    }
  }

  // Step 4: Verify final state
  console.log('\n3️⃣ VERIFYING FINAL STATE')
  console.log('-' .repeat(40))

  // Check admin view
  const finalProductRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (finalProductRes.ok) {
    const { product } = await finalProductRes.json()

    console.log('\nAdmin view - Prices in database:')
    product.variants?.forEach(v => {
      console.log(`\n${v.title}:`)
      if (v.prices && v.prices.length > 0) {
        v.prices.forEach(p => {
          const regionText = p.region_id === REGION_ID ? '✅ United States region' :
                           p.region_id ? `Other region (${p.region_id})` :
                           '❌ No region (generic)'
          console.log(`  ${p.currency_code.toUpperCase()} $${(p.amount/100).toFixed(2)} - ${regionText}`)
        })
      } else {
        console.log(`  No prices`)
      }
    })
  }

  // Check store view with region
  console.log('\nStore view - Prices for United States region:')

  const storeRes = await fetch(
    `${MEDUSA_URL}/store/products/${productId}?region_id=${REGION_ID}`,
    {
      headers: {
        'x-publishable-api-key': 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
      }
    }
  )

  if (storeRes.ok) {
    const { product } = await storeRes.json()

    product.variants?.forEach(v => {
      if (v.calculated_price?.calculated_amount) {
        console.log(`  ${v.title}: $${(v.calculated_price.calculated_amount / 100).toFixed(2)}`)
      } else {
        console.log(`  ${v.title}: No price available`)
      }
    })
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Price fixing complete!')
  console.log('\nIf prices still show incorrectly:')
  console.log('1. Go to Medusa Admin → Products → Sandwell Lipstick → Pricing')
  console.log('2. Manually add prices for "United States" region')
  console.log('3. Or restart the Medusa backend to clear cache')
}

finalFixPrices().catch(console.error)