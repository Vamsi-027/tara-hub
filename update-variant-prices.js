// Update variant prices for United States region
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const REGION_ID = 'reg_01K5DB032EF34GSDPW8DK7C20V' // United States region

async function updateVariantPrices() {
  console.log('💰 UPDATING VARIANT PRICES FOR UNITED STATES\n')
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

  // Get the product first
  const productId = 'prod_01K5DHGG4JGAZ24B9XW5J47JK2'

  console.log('Fetching product details...')
  const productRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!productRes.ok) {
    console.log('❌ Failed to fetch product')
    return
  }

  const { product } = await productRes.json()
  console.log(`✅ Found product: ${product.title}\n`)

  // Update each variant with prices
  for (const variant of product.variants || []) {
    console.log(`\n📦 Updating: ${variant.title}`)
    console.log(`   Variant ID: ${variant.id}`)

    // Determine price based on variant type
    let amount = 0
    if (variant.title.toLowerCase().includes('fabric') || variant.title.toLowerCase().includes('yard')) {
      amount = 39900 // $399.00 in cents
    } else if (variant.title.toLowerCase().includes('swatch')) {
      amount = 400 // $4.00 in cents
    }

    console.log(`   New Price: $${(amount / 100).toFixed(2)} USD`)

    try {
      // Update variant with prices array
      const updateRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}/variants/${variant.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prices: [
            {
              amount: amount,
              currency_code: 'usd',
              region_id: REGION_ID
            }
          ]
        })
      })

      if (updateRes.ok) {
        console.log(`   ✅ Price updated successfully!`)
      } else {
        const error = await updateRes.text()
        console.log(`   ❌ Failed to update: ${error.substring(0, 100)}`)
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`)
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Update complete!')
  console.log('\nNow checking if prices are set...\n')

  // Verify the prices
  const verifyRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (verifyRes.ok) {
    const { product: updatedProduct } = await verifyRes.json()

    updatedProduct.variants?.forEach(variant => {
      console.log(`\n${variant.title}:`)
      if (variant.prices && variant.prices.length > 0) {
        variant.prices.forEach(price => {
          if (price.region_id === REGION_ID) {
            console.log(`  ✅ United States price: $${(price.amount / 100).toFixed(2)}`)
          }
        })
      } else {
        console.log(`  ⚠️ No prices found`)
      }
    })
  }
}

updateVariantPrices().catch(console.error)