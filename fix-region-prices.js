// Fix prices to be associated with United States region
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const REGION_ID = 'reg_01K5DB032EF34GSDPW8DK7C20V' // United States region

async function fixRegionPrices() {
  console.log('🔧 FIXING PRICES TO USE UNITED STATES REGION\n')
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

  // First, delete existing prices without region
  console.log('1️⃣ Removing existing prices without region...')

  const productRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (productRes.ok) {
    const { product } = await productRes.json()

    for (const variant of product.variants || []) {
      console.log(`\n  ${variant.title}:`)

      // Delete prices without region
      for (const price of variant.prices || []) {
        if (!price.region_id) {
          console.log(`    Deleting price: ${price.currency_code} ${(price.amount/100).toFixed(2)}`)

          try {
            await fetch(`${MEDUSA_URL}/admin/products/variants/${variant.id}/prices/${price.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
            console.log(`    ✅ Deleted`)
          } catch (err) {
            console.log(`    ❌ Delete failed`)
          }
        }
      }
    }
  }

  // Now add new prices with United States region
  console.log('\n2️⃣ Adding new prices with United States region...')

  const variants = [
    {
      id: 'variant_01K5DHGGTNWQ79CC0658ZW9MR9',
      title: 'Fabric Per Yard',
      amount: 39900 // $399.00
    },
    {
      id: 'variant_01K5DHGGTNECAHXF6AS2EM2ECN',
      title: 'Swatch Sample',
      amount: 400 // $4.00
    }
  ]

  for (const variant of variants) {
    console.log(`\n  ${variant.title}:`)
    console.log(`    Price: $${(variant.amount/100).toFixed(2)}`)

    try {
      // Create new MoneyAmount with region
      const createRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}/variants/${variant.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prices: [{
            amount: variant.amount,
            currency_code: 'usd',
            region_id: REGION_ID
          }]
        })
      })

      if (createRes.ok) {
        console.log(`    ✅ Price added with region!`)
      } else {
        const error = await createRes.text()
        console.log(`    ❌ Failed: ${error.substring(0, 100)}`)
      }
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`)
    }
  }

  // Verify the changes
  console.log('\n3️⃣ Verifying changes...')

  const verifyRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (verifyRes.ok) {
    const { product } = await verifyRes.json()

    console.log('\nFinal pricing:')
    product.variants?.forEach(v => {
      console.log(`\n  ${v.title}:`)
      v.prices?.forEach(p => {
        const regionText = p.region_id ? `United States (${p.region_id})` : 'No region'
        console.log(`    ${p.currency_code.toUpperCase()} ${(p.amount/100).toFixed(2)} - ${regionText}`)
      })
    })
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Price fixing complete!')
}

fixRegionPrices().catch(console.error)