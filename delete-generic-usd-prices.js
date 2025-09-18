// Delete generic USD prices (keep only United States region prices)
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function deleteGenericUSDPrices() {
  console.log('🗑️ DELETING GENERIC USD PRICES\n')
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

  // Prices to delete (from previous scan)
  const pricesToDelete = [
    { id: 'price_01K5DHPRFQVARK5VMXGNVA6JB3', desc: 'Fabric Per Yard - $3.21' },
    { id: 'price_01K5DHGHXHTK0042KDP6W62XGS', desc: 'Fabric Per Yard - $1.23' },
    { id: 'price_01K5DHHRFZH8MC43MQNBMHXXVC', desc: 'Swatch Sample - $1.00' },
    { id: 'price_01K5DHGHXHK0RQKXA53XPK1696', desc: 'Swatch Sample - $5.00' }
  ]

  console.log('Deleting generic USD prices (without region):\n')

  for (const price of pricesToDelete) {
    console.log(`❌ Deleting: ${price.desc}`)
    console.log(`   Price ID: ${price.id}`)

    // Try multiple delete endpoints
    const endpoints = [
      `${MEDUSA_URL}/admin/products/variants/prices/${price.id}`,
      `${MEDUSA_URL}/admin/prices/${price.id}`,
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
      console.log('   ⚠️ Could not delete - may already be removed\n')
    }
  }

  console.log('=' .repeat(60))
  console.log('✅ Cleanup complete!')
  console.log('\n📝 Next steps:')
  console.log('1. Add "United States" region prices in Medusa admin')
  console.log('2. Go to Products → Sandwell Lipstick → Pricing')
  console.log('3. Add prices for "United States" region:')
  console.log('   - Fabric Per Yard: $3.99')
  console.log('   - Swatch Sample: $0.04')
}

deleteGenericUSDPrices().catch(console.error)