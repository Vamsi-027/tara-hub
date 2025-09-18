// Test fabric-store API to see what prices are being returned
const FABRIC_STORE_URL = 'https://fabric-store-ten.vercel.app'
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const KEY = 'pk_49ebbbe6498305cd3ec7b42aaedbdebb37145d952652e29238e2a23ab8ce0538'
const REGION_ID = 'reg_01K5DB032EF34GSDPW8DK7C20V'

async function testFabricAPI() {
  console.log('🔍 TESTING FABRIC STORE API PRICING\n')
  console.log('=' .repeat(60))

  // 1. Test fabric-store API
  console.log('1️⃣ Testing Fabric Store API...')
  try {
    const fabricRes = await fetch(`${FABRIC_STORE_URL}/api/fabrics`)

    if (fabricRes.ok) {
      const data = await fabricRes.json()
      console.log(`✅ API returned ${data.fabrics?.length || 0} fabrics\n`)

      if (data.fabrics && data.fabrics.length > 0) {
        const fabric = data.fabrics[0]
        console.log('Sample Fabric:')
        console.log(`  Name: ${fabric.name}`)
        console.log(`  Price: $${fabric.price}`)
        console.log(`  Swatch Price: $${fabric.swatch_price}`)
        console.log(`  Variants:`)
        fabric.variants?.forEach(v => {
          console.log(`    - ${v.title}: $${v.price}`)
        })
      }
    } else {
      console.log('❌ Failed to fetch from fabric-store API')
    }
  } catch (err) {
    console.log('❌ Error calling fabric-store API:', err.message)
  }

  // 2. Test direct Medusa API with region
  console.log('\n2️⃣ Testing Direct Medusa API with United States Region...')
  console.log(`   Region ID: ${REGION_ID}`)

  try {
    // Get products with region pricing
    const medusaRes = await fetch(`${MEDUSA_URL}/store/products?region_id=${REGION_ID}`, {
      headers: {
        'x-publishable-api-key': KEY
      }
    })

    if (medusaRes.ok) {
      const data = await medusaRes.json()
      console.log(`\n✅ Medusa returned ${data.products?.length || 0} products`)

      if (data.products && data.products.length > 0) {
        const product = data.products[0]
        console.log(`\nProduct: ${product.title}`)

        product.variants?.forEach(variant => {
          console.log(`\n  Variant: ${variant.title}`)
          console.log(`    Variant ID: ${variant.id}`)

          // Check calculated price
          if (variant.calculated_price) {
            console.log(`    Calculated Price: ${variant.calculated_price.calculated_amount}`)
            console.log(`    Currency: ${variant.calculated_price.currency_code}`)
          } else {
            console.log(`    ⚠️ No calculated price`)
          }

          // Check raw prices
          if (variant.prices && variant.prices.length > 0) {
            console.log(`    Raw Prices:`)
            variant.prices.forEach(p => {
              console.log(`      - ${p.currency_code} ${p.amount} (Region: ${p.region_id || 'none'})`)
            })
          } else {
            console.log(`    ⚠️ No prices found`)
          }
        })
      }
    } else {
      console.log('❌ Failed to fetch from Medusa:', medusaRes.status)
    }
  } catch (err) {
    console.log('❌ Error calling Medusa API:', err.message)
  }

  // 3. Test specific product endpoint
  console.log('\n3️⃣ Testing Specific Product with Region...')
  const productId = 'prod_01K5DHGG4JGAZ24B9XW5J47JK2'

  try {
    const productRes = await fetch(`${MEDUSA_URL}/store/products/${productId}?region_id=${REGION_ID}`, {
      headers: {
        'x-publishable-api-key': KEY
      }
    })

    if (productRes.ok) {
      const { product } = await productRes.json()
      console.log(`\n✅ Product: ${product.title}`)

      product.variants?.forEach(variant => {
        console.log(`\n  ${variant.title}:`)
        if (variant.calculated_price) {
          console.log(`    Price: $${(variant.calculated_price.calculated_amount / 100).toFixed(2)}`)
        } else {
          console.log(`    ⚠️ No price available for this region`)
        }
      })
    }
  } catch (err) {
    console.log('❌ Error:', err.message)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Test complete')
}

testFabricAPI()