// Check if prices are coming from price lists
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function checkPriceLists() {
  console.log('🔍 CHECKING PRICE LISTS AND DETAILED PRICING\n')
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

  // 1. Check price lists
  console.log('1️⃣ CHECKING PRICE LISTS')
  console.log('-' .repeat(40))

  const priceListsRes = await fetch(`${MEDUSA_URL}/admin/price-lists`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (priceListsRes.ok) {
    const { price_lists } = await priceListsRes.json()
    console.log(`Found ${price_lists?.length || 0} price list(s)\n`)

    if (price_lists && price_lists.length > 0) {
      for (const list of price_lists) {
        console.log(`📋 Price List: ${list.name}`)
        console.log(`   ID: ${list.id}`)
        console.log(`   Status: ${list.status}`)
        console.log(`   Type: ${list.type}`)

        if (list.prices && list.prices.length > 0) {
          console.log(`   Prices: ${list.prices.length}`)
          list.prices.forEach(p => {
            console.log(`     - Variant ${p.variant_id}: ${p.currency_code} ${p.amount/100}`)
          })
        }
        console.log('')
      }
    } else {
      console.log('No price lists found\n')
    }
  }

  // 2. Get detailed product pricing
  console.log('2️⃣ DETAILED PRODUCT PRICING')
  console.log('-' .repeat(40))

  const productId = 'prod_01K5C2CN06C8E90SGS1NY77JQD'

  // Get with expanded relations
  const productRes = await fetch(
    `${MEDUSA_URL}/admin/products/${productId}?expand=variants.prices.price_list,variants.prices.region`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )

  if (productRes.ok) {
    const { product } = await productRes.json()

    product.variants?.forEach(variant => {
      console.log(`\n📦 Variant: ${variant.title}`)
      console.log(`   ID: ${variant.id}`)

      if (variant.prices && variant.prices.length > 0) {
        console.log(`   Prices (${variant.prices.length} total):`)

        variant.prices.forEach((price, idx) => {
          console.log(`\n   Price #${idx + 1}:`)
          console.log(`     Amount: ${price.currency_code.toUpperCase()} ${(price.amount/100).toFixed(2)}`)
          console.log(`     Price ID: ${price.id}`)
          console.log(`     Region ID: ${price.region_id || 'None'}`)
          console.log(`     Price List ID: ${price.price_list_id || 'None'}`)
          console.log(`     Created: ${new Date(price.created_at).toLocaleString()}`)
        })
      } else {
        console.log(`   No prices found`)
      }
    })
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Analysis complete')
}

checkPriceLists().catch(console.error)