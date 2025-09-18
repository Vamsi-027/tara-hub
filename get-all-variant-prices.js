// Get all variant prices with details
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function getAllVariantPrices() {
  console.log('💰 FETCHING ALL VARIANT PRICES\n')
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

  // Get all products
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

  const pricesToDelete = []

  for (const product of products) {
    console.log(`\n📦 Product: ${product.title} (${product.id})`)
    console.log('-' .repeat(40))

    for (const variant of product.variants || []) {
      console.log(`\nVariant: ${variant.title} (${variant.id})`)

      if (variant.prices && variant.prices.length > 0) {
        console.log(`  Prices (${variant.prices.length} total):`)

        variant.prices.forEach(price => {
          const isRegionPrice = !!price.region_id
          const regionLabel = isRegionPrice ? `Region: ${price.region_id}` : 'Generic USD (no region)'

          console.log(`\n  💵 ${price.currency_code.toUpperCase()} ${(price.amount/100).toFixed(2)}`)
          console.log(`     Price ID: ${price.id}`)
          console.log(`     Type: ${regionLabel}`)

          // Mark generic USD prices (without region) for deletion
          if (!price.region_id && price.currency_code === 'usd') {
            console.log(`     ❌ MARKED FOR DELETION (generic USD without region)`)
            pricesToDelete.push({
              priceId: price.id,
              variantId: variant.id,
              productTitle: product.title,
              amount: price.amount/100,
              reason: 'Generic USD price without region'
            })
          }
        })
      } else {
        console.log(`  No prices found`)
      }
    }
  }

  if (pricesToDelete.length > 0) {
    console.log('\n' + '=' .repeat(60))
    console.log('🗑️ PRICES TO DELETE:')
    console.log('-' .repeat(40))

    pricesToDelete.forEach(p => {
      console.log(`\n${p.productTitle}`)
      console.log(`  Price: $${p.amount}`)
      console.log(`  Price ID: ${p.priceId}`)
      console.log(`  Reason: ${p.reason}`)
    })

    console.log('\n' + '=' .repeat(60))
    console.log(`Total prices to delete: ${pricesToDelete.length}`)
  } else {
    console.log('\n✅ No generic USD prices found - all prices are region-specific')
  }

  return pricesToDelete
}

getAllVariantPrices().catch(console.error)