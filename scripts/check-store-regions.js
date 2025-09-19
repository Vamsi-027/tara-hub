#!/usr/bin/env node

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function checkRegions() {
  console.log('🔍 Checking regions via store API...\n')

  try {
    // Try without any headers first
    console.log('1. Trying without headers...')
    const response1 = await fetch(`${MEDUSA_URL}/store/regions`)
    console.log('   Status:', response1.status)
    const text1 = await response1.text()

    try {
      const data = JSON.parse(text1)
      if (data.regions) {
        console.log(`   ✅ Found ${data.regions.length} regions`)
        if (data.regions.length > 0) {
          console.log('\nRegions found:')
          data.regions.forEach(r => {
            console.log(`\n   📍 ${r.name || 'Unnamed'}`)
            console.log(`      ID: ${r.id}`)
            console.log(`      Currency: ${r.currency_code}`)
            console.log(`      Countries: ${r.countries?.map(c => c.iso_2).join(', ') || 'none'}`)
          })

          // Return the first region ID for use in orders
          console.log('\n✅ Use this region ID in orders/create route:')
          console.log(`   region_id: '${data.regions[0].id}'`)
        }
      } else if (data.message) {
        console.log(`   ❌ Error: ${data.message}`)
      }
    } catch (e) {
      console.log('   Raw response:', text1.substring(0, 200))
    }

    // Also check products endpoint
    console.log('\n2. Checking products endpoint...')
    const response2 = await fetch(`${MEDUSA_URL}/store/products`)
    console.log('   Status:', response2.status)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkRegions()