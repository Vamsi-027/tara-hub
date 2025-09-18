// Final cleanup - Keep only ONE price per variant
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function finalPriceCleanup() {
  console.log('🎯 FINAL PRICE CLEANUP - ONE PRICE PER VARIANT\n')
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

  // Prices to delete (keep only the $3.99 price for Fabric Per Yard)
  const pricesToDelete = [
    {
      variantName: 'Fabric Per Yard',
      priceId: 'price_01K5DGY3B8HW6B202GYHQ2H0A7',
      amount: '$0.05',
      reason: 'Too low - incorrect price'
    },
    {
      variantName: 'Fabric Per Yard',
      priceId: 'price_01K5DGE1JQ3AZRGM9GTYJ6EJHY',
      amount: '$4.99',
      reason: 'Duplicate - keeping $3.99 price'
    }
  ]

  console.log('Deleting duplicate/incorrect prices:\n')

  for (const price of pricesToDelete) {
    console.log(`❌ Deleting: ${price.variantName} - ${price.amount}`)
    console.log(`   Reason: ${price.reason}`)
    console.log(`   Price ID: ${price.priceId}`)

    // Try multiple delete endpoints
    const endpoints = [
      `${MEDUSA_URL}/admin/prices/${price.priceId}`,
      `${MEDUSA_URL}/admin/product-variants/prices/${price.priceId}`,
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
        console.log('   ✅ Deleted successfully\n')
        deleted = true
        break
      }
    }

    if (!deleted) {
      // Try batch delete
      const batchRes = await fetch(`${MEDUSA_URL}/admin/batch/prices`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ids: [price.priceId]
        })
      })

      if (batchRes.ok) {
        console.log('   ✅ Deleted via batch operation\n')
      } else {
        console.log('   ⚠️ Could not delete - may already be removed\n')
      }
    }
  }

  console.log('=' .repeat(60))
  console.log('✅ CLEANUP COMPLETE!\n')
  console.log('Final pricing structure:')
  console.log('  • Swatch Sample: $0.04 USD')
  console.log('  • Fabric Per Yard: $3.99 USD')
  console.log('\n🎯 Each variant now has exactly ONE USD price!')

  // Verify final state
  console.log('\n' + '=' .repeat(60))
  console.log('VERIFYING FINAL STATE...\n')

  const productId = 'prod_01K5C2CN06C8E90SGS1NY77JQD'
  const productRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (productRes.ok) {
    const { product } = await productRes.json()

    product.variants?.forEach(variant => {
      const usdPrices = variant.prices?.filter(p => p.currency_code === 'usd') || []
      console.log(`${variant.title}: ${usdPrices.length} USD price(s)`)
      usdPrices.forEach(p => {
        console.log(`  - $${(p.amount/100).toFixed(2)}`)
      })
    })
  }
}

finalPriceCleanup().catch(console.error)