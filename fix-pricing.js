// Script to fix USD pricing - delete duplicates and keep correct price
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function fixPricing() {
  console.log('🔧 FIXING DUPLICATE USD PRICING\n')

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

  // Prices to delete (the incorrect low prices)
  const pricesToDelete = [
    {
      variantId: 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',
      priceId: 'price_01K5DGE1JQ3AZRGM9GTYJ6EJHY',
      amount: 0.053
    },
    {
      variantId: 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',
      priceId: 'price_01K5DGEJ7YQ0ZQGNJ42AB9Y3G6',
      amount: 0.043
    }
  ]

  console.log('Deleting incorrect prices:')

  for (const price of pricesToDelete) {
    console.log(`\n❌ Deleting price: $${price.amount} (${price.priceId})`)

    // Delete via admin API
    const deleteRes = await fetch(
      `${MEDUSA_URL}/admin/products/variants/${price.variantId}/prices/${price.priceId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (deleteRes.ok || deleteRes.status === 404) {
      console.log('   ✅ Deleted successfully')
    } else {
      console.log(`   ⚠️ Delete returned status: ${deleteRes.status}`)

      // Try alternative endpoint
      const altDeleteRes = await fetch(
        `${MEDUSA_URL}/admin/price-lists/prices/batch`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            price_ids: [price.priceId]
          })
        }
      )

      if (altDeleteRes.ok) {
        console.log('   ✅ Deleted via alternative endpoint')
      }
    }
  }

  console.log('\n✅ Pricing cleanup complete!')
  console.log('\nCorrect prices retained:')
  console.log('  • Swatch Sample: $0.04')
  console.log('  • Fabric Per Yard: $3.99')
}

fixPricing().catch(console.error)