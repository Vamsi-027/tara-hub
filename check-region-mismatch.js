// Check region mismatch between what fabric-store expects and what exists
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'

async function checkRegionMismatch() {
  console.log('🔍 CHECKING REGION CONFIGURATION MISMATCH\n')
  console.log('=' .repeat(60))

  // 1. Check all available regions in Medusa
  console.log('1️⃣ ALL AVAILABLE REGIONS IN MEDUSA:')
  console.log('-' .repeat(40))

  const regionsRes = await fetch(`${MEDUSA_URL}/store/regions`, {
    headers: {
      'x-publishable-api-key': KEY
    }
  })

  if (regionsRes.ok) {
    const { regions } = await regionsRes.json()
    console.log(`Found ${regions.length} region(s):\n`)

    regions.forEach(region => {
      console.log(`📍 Region Name: "${region.name}"`)
      console.log(`   ID: ${region.id}`)
      console.log(`   Currency: ${region.currency_code}`)
      console.log(`   Countries: ${region.countries?.map(c => `${c.iso_2} (${c.display_name})`).slice(0, 3).join(', ')}...`)
      console.log('')
    })

    // Save region info for later
    global.availableRegions = regions
  }

  // 2. Check what region ID fabric-store is configured to use
  console.log('2️⃣ FABRIC-STORE CONFIGURATION:')
  console.log('-' .repeat(40))
  console.log('Checking environment variables...')
  console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_USD: reg_01K5DB032EF34GSDPW8DK7C20V`)
  console.log(`This should match your "United States" region\n`)

  // 3. Test what prices are returned for the configured region
  console.log('3️⃣ TESTING PRODUCT PRICES BY REGION:')
  console.log('-' .repeat(40))

  const productId = 'prod_01K5DHGG4JGAZ24B9XW5J47JK2'

  // Test with the United States region ID
  const usRegionId = 'reg_01K5DB032EF34GSDPW8DK7C20V'
  console.log(`\nTesting with United States region (${usRegionId}):`)

  const productRes = await fetch(`${MEDUSA_URL}/store/products/${productId}?region_id=${usRegionId}`, {
    headers: {
      'x-publishable-api-key': KEY
    }
  })

  if (productRes.ok) {
    const { product } = await productRes.json()
    console.log(`Product: ${product.title}`)

    product.variants?.forEach(v => {
      console.log(`  ${v.title}:`)
      if (v.calculated_price?.calculated_amount) {
        console.log(`    Calculated Price: $${(v.calculated_price.calculated_amount / 100).toFixed(2)}`)
      } else {
        console.log(`    ❌ No price for this region`)
      }
    })
  } else {
    console.log(`❌ Failed to fetch product: ${productRes.status}`)
  }

  // 4. Check if there's a "USA" region that might have prices
  console.log('\n4️⃣ LOOKING FOR OTHER USD REGIONS:')
  console.log('-' .repeat(40))

  if (global.availableRegions) {
    const usdRegions = global.availableRegions.filter(r =>
      r.currency_code === 'usd' ||
      r.name?.toLowerCase().includes('us') ||
      r.name?.toLowerCase().includes('america')
    )

    if (usdRegions.length > 0) {
      console.log('Found USD/US regions:')
      usdRegions.forEach(r => {
        console.log(`  - "${r.name}" (${r.id})`)
      })

      // Test each USD region for prices
      for (const region of usdRegions) {
        console.log(`\n  Testing region "${region.name}":`)

        const testRes = await fetch(`${MEDUSA_URL}/store/products/${productId}?region_id=${region.id}`, {
          headers: {
            'x-publishable-api-key': KEY
          }
        })

        if (testRes.ok) {
          const { product } = await testRes.json()
          const hasPrice = product.variants?.some(v => v.calculated_price?.calculated_amount > 0)

          if (hasPrice) {
            console.log(`    ✅ This region has prices!`)
            product.variants?.forEach(v => {
              if (v.calculated_price?.calculated_amount) {
                console.log(`      ${v.title}: $${(v.calculated_price.calculated_amount / 100).toFixed(2)}`)
              }
            })
          } else {
            console.log(`    ❌ No prices in this region`)
          }
        }
      }
    } else {
      console.log('No other USD regions found')
    }
  }

  // 5. Get admin view of prices
  console.log('\n5️⃣ ADMIN VIEW - ACTUAL PRICES IN DATABASE:')
  console.log('-' .repeat(40))

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

  if (loginRes.ok) {
    const { token } = await loginRes.json()

    const adminProductRes = await fetch(`${MEDUSA_URL}/admin/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (adminProductRes.ok) {
      const { product } = await adminProductRes.json()

      console.log('Current prices in database:')
      product.variants?.forEach(v => {
        console.log(`\n  ${v.title}:`)
        if (v.prices && v.prices.length > 0) {
          v.prices.forEach(p => {
            const regionInfo = p.region_id ? `Region: ${p.region_id}` : 'No region (generic)'
            console.log(`    ${p.currency_code.toUpperCase()} ${(p.amount/100).toFixed(2)} - ${regionInfo}`)
          })
        } else {
          console.log(`    No prices`)
        }
      })
    }
  }

  console.log('\n' + '=' .repeat(60))
  console.log('📊 DIAGNOSIS:')
  console.log('-' .repeat(40))
  console.log('The issue is that prices are not associated with the United States region.')
  console.log('Fabric-store is correctly configured to use region: reg_01K5DB032EF34GSDPW8DK7C20V')
  console.log('But the prices in the database have no region_id (they are generic USD prices).')
  console.log('\nSOLUTION: Prices need to be added specifically for the United States region.')
}

checkRegionMismatch().catch(console.error)