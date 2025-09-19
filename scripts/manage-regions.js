#!/usr/bin/env node

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function manageRegions() {
  console.log('🌍 Region Management Tool\n')
  console.log('Since the Medusa admin UI has a rendering bug, use this tool to manage regions.\n')
  console.log('=' .repeat(60))

  try {
    // Fetch regions using the store API
    console.log('\n📍 Fetching current regions...\n')

    const response = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    })

    if (!response.ok) {
      console.error('❌ Failed to fetch regions:', response.status, response.statusText)
      return
    }

    const { regions } = await response.json()

    if (!regions || regions.length === 0) {
      console.log('❌ No regions found in the system.')
      console.log('\nTo create regions, you need to:')
      console.log('1. Access the Railway database directly')
      console.log('2. Or redeploy Medusa with seed data')
      return
    }

    console.log(`✅ Found ${regions.length} region(s):\n`)

    regions.forEach((region, index) => {
      console.log(`${index + 1}. ${region.name}`)
      console.log(`   ID: ${region.id}`)
      console.log(`   Currency: ${region.currency_code}`)
      console.log(`   Tax Rate: ${region.tax_rate || 0}%`)

      if (region.countries && region.countries.length > 0) {
        console.log(`   Countries: ${region.countries.map(c => c.display_name || c.iso_2).join(', ')}`)
      }

      if (region.payment_providers && region.payment_providers.length > 0) {
        console.log(`   Payment Providers: ${region.payment_providers.map(p => p.id).join(', ')}`)
      }

      console.log('')
    })

    console.log('=' .repeat(60))
    console.log('\n📋 Region IDs for configuration:\n')

    regions.forEach(region => {
      console.log(`${region.name}: '${region.id}'`)
    })

    console.log('\n✅ Use these region IDs in your environment variables:')
    console.log(`   NEXT_PUBLIC_REGION_ID=${regions[0].id}`)

    console.log('\n🔧 Workaround for Admin Panel Bug:')
    console.log('   The Medusa admin panel has a UI bug preventing region display.')
    console.log('   However, the regions exist and work correctly via API.')
    console.log('   Orders can be created using the region IDs above.')

    // Test if we can create a cart with the first region
    console.log('\n🧪 Testing region functionality...')

    const testResponse = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        region_id: regions[0].id,
        currency_code: regions[0].currency_code
      })
    })

    if (testResponse.ok) {
      const { cart } = await testResponse.json()
      console.log('   ✅ Successfully created test cart with region:', regions[0].name)
      console.log('   Cart ID:', cart.id)
      console.log('   Region works correctly!')
    } else {
      console.log('   ⚠️  Could not create test cart:', await testResponse.text())
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the script
manageRegions()