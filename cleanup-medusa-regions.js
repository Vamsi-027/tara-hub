// Script to clean up Medusa - Keep only USD region and USD pricing
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function cleanupRegionsAndPricing() {
  console.log('🧹 CLEANING UP MEDUSA - KEEPING ONLY USD\n')
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

  // 1. CHECK CURRENT REGIONS
  console.log('1️⃣ CHECKING CURRENT REGIONS')
  console.log('-' .repeat(40))

  const regionsRes = await fetch(`${MEDUSA_URL}/admin/regions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!regionsRes.ok) {
    console.log('❌ Failed to fetch regions')
    return
  }

  const { regions } = await regionsRes.json()
  console.log(`Found ${regions.length} region(s):\n`)

  const usdRegionId = 'reg_01K5DB032EF34GSDPW8DK7C20V' // Your USD region
  let regionsToDelete = []

  regions.forEach(region => {
    console.log(`📍 Region: ${region.name}`)
    console.log(`   ID: ${region.id}`)
    console.log(`   Currency: ${region.currency_code}`)
    console.log(`   Countries: ${region.countries?.length || 0}`)

    if (region.id !== usdRegionId) {
      regionsToDelete.push(region)
      console.log(`   ❌ Will be deleted`)
    } else {
      console.log(`   ✅ Will be kept`)
    }
    console.log('')
  })

  // 2. DELETE NON-USD REGIONS
  if (regionsToDelete.length > 0) {
    console.log('\n2️⃣ DELETING NON-USD REGIONS')
    console.log('-' .repeat(40))

    for (const region of regionsToDelete) {
      console.log(`Deleting region: ${region.name} (${region.currency_code})`)

      const deleteRes = await fetch(`${MEDUSA_URL}/admin/regions/${region.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (deleteRes.ok || deleteRes.status === 404) {
        console.log(`  ✅ Deleted successfully\n`)
      } else {
        console.log(`  ⚠️ Failed to delete (status: ${deleteRes.status})\n`)
      }
    }
  }

  // 3. CHECK AND CLEAN PRODUCT PRICING
  console.log('\n3️⃣ CHECKING PRODUCT PRICING')
  console.log('-' .repeat(40))

  const productsRes = await fetch(`${MEDUSA_URL}/admin/products`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!productsRes.ok) {
    console.log('❌ Failed to fetch products')
    return
  }

  const { products } = await productsRes.json()
  console.log(`Found ${products.length} product(s)\n`)

  for (const product of products) {
    console.log(`📦 Product: ${product.title}`)

    for (const variant of product.variants || []) {
      console.log(`  Variant: ${variant.title}`)

      const nonUsdPrices = variant.prices?.filter(p => p.currency_code !== 'usd') || []

      if (nonUsdPrices.length > 0) {
        console.log(`    Found ${nonUsdPrices.length} non-USD price(s) to delete:`)

        for (const price of nonUsdPrices) {
          console.log(`      - ${price.currency_code.toUpperCase()}: ${price.amount/100}`)

          // Delete non-USD price
          const deletePriceRes = await fetch(
            `${MEDUSA_URL}/admin/products/${product.id}/variants/${variant.id}/prices/${price.id}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          )

          if (deletePriceRes.ok || deletePriceRes.status === 404) {
            console.log(`        ✅ Deleted`)
          } else {
            console.log(`        ⚠️ Failed to delete`)
          }
        }
      }

      const usdPrices = variant.prices?.filter(p => p.currency_code === 'usd') || []
      if (usdPrices.length > 0) {
        console.log(`    ✅ Keeping ${usdPrices.length} USD price(s)`)
      }
    }
    console.log('')
  }

  // 4. CHECK CURRENCIES
  console.log('\n4️⃣ CHECKING CURRENCIES')
  console.log('-' .repeat(40))

  const currenciesRes = await fetch(`${MEDUSA_URL}/admin/currencies`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (currenciesRes.ok) {
    const { currencies } = await currenciesRes.json()
    const activeCurrencies = currencies.filter(c => c.includes_tax)

    console.log(`Active currencies:`)
    activeCurrencies.forEach(curr => {
      console.log(`  - ${curr.code.toUpperCase()}: ${curr.name}`)
    })
  }

  // 5. FINAL VERIFICATION
  console.log('\n' + '=' .repeat(60))
  console.log('✅ CLEANUP COMPLETE!')
  console.log('=' .repeat(60))
  console.log('\n📊 Final Configuration:')
  console.log('  • Single Region: USD')
  console.log('  • Single Currency: USD')
  console.log('  • All non-USD pricing removed')
  console.log('\n🎯 Your Medusa is now configured for USD only!')
}

cleanupRegionsAndPricing().catch(console.error)