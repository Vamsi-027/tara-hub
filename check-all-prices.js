// Check all pricing structures in Medusa
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function checkAllPrices() {
  console.log('🔍 CHECKING ALL PRICING STRUCTURES\n')
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

  // 1. Check regions and their currencies
  console.log('1️⃣ CHECKING REGIONS')
  console.log('-' .repeat(40))

  const regionsRes = await fetch(`${MEDUSA_URL}/admin/regions`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (regionsRes.ok) {
    const { regions } = await regionsRes.json()
    console.log(`Found ${regions.length} region(s):\n`)

    regions.forEach(region => {
      console.log(`📍 Region: ${region.name}`)
      console.log(`   ID: ${region.id}`)
      console.log(`   Currency: ${region.currency_code}`)
      console.log(`   Countries: ${region.countries?.map(c => c.iso_2).join(', ') || 'None'}`)
      console.log('')
    })
  }

  // 2. Check product pricing details
  console.log('2️⃣ CHECKING PRODUCT PRICES')
  console.log('-' .repeat(40))

  const productId = 'prod_01K5C2CN06C8E90SGS1NY77JQD'
  const productRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}?expand=variants.prices.region`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (productRes.ok) {
    const { product } = await productRes.json()
    console.log(`\n📦 Product: ${product.title}\n`)

    product.variants?.forEach(variant => {
      console.log(`Variant: ${variant.title} (${variant.id})`)

      if (variant.prices && variant.prices.length > 0) {
        console.log(`  Found ${variant.prices.length} price(s):`)

        const pricesByRegion = {}

        variant.prices.forEach((price, idx) => {
          const regionName = price.region?.name || 'No Region'
          const regionId = price.region_id || 'none'

          if (!pricesByRegion[regionName]) {
            pricesByRegion[regionName] = []
          }

          pricesByRegion[regionName].push({
            amount: `${price.currency_code.toUpperCase()} ${(price.amount/100).toFixed(2)}`,
            priceId: price.id,
            regionId: regionId
          })
        })

        // Display prices grouped by region
        Object.entries(pricesByRegion).forEach(([regionName, prices]) => {
          console.log(`\n  💰 ${regionName}:`)
          prices.forEach(p => {
            console.log(`     ${p.amount}`)
            console.log(`     Price ID: ${p.priceId}`)
            console.log(`     Region ID: ${p.regionId}`)
          })
        })

      } else {
        console.log(`  No prices found`)
      }
      console.log('')
    })
  }

  // 3. Identify duplicate/old prices to delete
  console.log('\n3️⃣ IDENTIFYING PRICES TO DELETE')
  console.log('-' .repeat(40))

  console.log('\nTo keep only "United States" pricing:')
  console.log('1. Delete any prices without a region (generic USD)')
  console.log('2. Delete any prices from other regions')
  console.log('3. Keep only prices associated with "United States" region')

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Analysis complete')
}

checkAllPrices().catch(console.error)