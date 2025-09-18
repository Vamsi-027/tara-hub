// Script to delete specific USD pricing from Medusa
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function deletePricing() {
  console.log('🔍 Fetching product pricing information...\n')

  // First, get admin token
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
  console.log('✅ Admin authentication successful\n')

  // Get product with variants and prices
  const productId = 'prod_01K5C2CN06C8E90SGS1NY77JQD'

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

  console.log('📦 Product:', product.title)
  console.log('\n💰 Current Prices:')

  // Show all variant prices
  product.variants?.forEach(variant => {
    console.log(`\nVariant: ${variant.title} (${variant.id})`)
    variant.prices?.forEach(price => {
      console.log(`  - ${price.currency_code.toUpperCase()}: ${price.amount/100}`)
      console.log(`    Price ID: ${price.id}`)
      console.log(`    Region: ${price.region_id || 'No specific region'}`)
    })
  })

  console.log('\n⚠️ To delete a specific price:')
  console.log('1. Note the Price ID from above')
  console.log('2. Uncomment the delete code below and add the price ID')

  // UNCOMMENT TO DELETE A SPECIFIC PRICE:
  /*
  const priceIdToDelete = 'price_XXXXX' // Replace with actual price ID

  const deleteRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}/variants/${variantId}/prices/${priceIdToDelete}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (deleteRes.ok) {
    console.log('✅ Price deleted successfully')
  } else {
    console.log('❌ Failed to delete price')
  }
  */
}

deletePricing().catch(console.error)