// Check product status and availability
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
const REGION_ID = 'reg_01K5DB032EF34GSDPW8DK7C20V'

async function checkProductStatus() {
  console.log('🔍 CHECKING PRODUCT STATUS AND AVAILABILITY\n')
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

  // Check product in admin
  console.log('1️⃣ ADMIN VIEW - Product Status')
  console.log('-' .repeat(40))

  const productId = 'prod_01K5DHGG4JGAZ24B9XW5J47JK2'
  const adminRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (adminRes.ok) {
    const { product } = await adminRes.json()
    console.log(`Product: ${product.title}`)
    console.log(`  ID: ${product.id}`)
    console.log(`  Status: ${product.status}`)
    console.log(`  Handle: ${product.handle}`)
    console.log(`  Sales Channels: ${product.sales_channels?.map(sc => sc.name).join(', ') || 'None'}`)

    console.log(`\n  Variants:`)
    product.variants?.forEach(v => {
      console.log(`    ${v.title}:`)
      console.log(`      Manage Inventory: ${v.manage_inventory}`)
      console.log(`      Allow Backorder: ${v.allow_backorder}`)
      console.log(`      Inventory Quantity: ${v.inventory_quantity}`)
      console.log(`      Prices: ${v.prices?.length || 0} price(s)`)

      v.prices?.forEach(p => {
        console.log(`        - ${p.currency_code} ${(p.amount/100).toFixed(2)} (Region: ${p.region_id || 'none'})`)
      })
    })
  }

  // Check if product is visible in store API
  console.log('\n\n2️⃣ STORE VIEW - Product Visibility')
  console.log('-' .repeat(40))

  // Try without region first
  console.log('\nWithout region:')
  const storeRes1 = await fetch(`${MEDUSA_URL}/store/products`, {
    headers: {
      'x-publishable-api-key': KEY
    }
  })

  if (storeRes1.ok) {
    const data1 = await storeRes1.json()
    console.log(`  Products found: ${data1.products?.length || 0}`)
    if (data1.products?.length > 0) {
      console.log(`  First product: ${data1.products[0].title}`)
    }
  }

  // Try with United States region
  console.log('\nWith United States region:')
  const storeRes2 = await fetch(`${MEDUSA_URL}/store/products?region_id=${REGION_ID}`, {
    headers: {
      'x-publishable-api-key': KEY
    }
  })

  if (storeRes2.ok) {
    const data2 = await storeRes2.json()
    console.log(`  Products found: ${data2.products?.length || 0}`)
    if (data2.products?.length > 0) {
      console.log(`  First product: ${data2.products[0].title}`)
    }
  }

  // Try custom endpoint
  console.log('\nWith custom endpoint:')
  const storeRes3 = await fetch(`${MEDUSA_URL}/store/products-with-metadata?region_id=${REGION_ID}`, {
    headers: {
      'x-publishable-api-key': KEY
    }
  })

  if (storeRes3.ok) {
    const data3 = await storeRes3.json()
    console.log(`  Products found: ${data3.products?.length || 0}`)
  } else {
    console.log(`  Custom endpoint returned: ${storeRes3.status}`)
  }

  // Check region details
  console.log('\n\n3️⃣ REGION CONFIGURATION')
  console.log('-' .repeat(40))

  const regionRes = await fetch(`${MEDUSA_URL}/admin/regions/${REGION_ID}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (regionRes.ok) {
    const { region } = await regionRes.json()
    console.log(`Region: ${region.name}`)
    console.log(`  ID: ${region.id}`)
    console.log(`  Currency: ${region.currency_code}`)
    console.log(`  Countries: ${region.countries?.length || 0}`)
    console.log(`  Payment Providers: ${region.payment_providers?.map(p => p.id).join(', ') || 'None'}`)
    console.log(`  Fulfillment Providers: ${region.fulfillment_providers?.map(f => f.id).join(', ') || 'None'}`)
    console.log(`  Tax Rate: ${region.tax_rate}%`)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Status check complete')
}

checkProductStatus().catch(console.error)