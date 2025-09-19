#!/usr/bin/env node

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function checkRegions() {
  console.log('🔍 Checking regions in production Medusa...\n')

  try {
    // Check store regions (public endpoint)
    const storeResponse = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    })

    if (storeResponse.ok) {
      const { regions } = await storeResponse.json()
      console.log(`✅ Found ${regions?.length || 0} regions in store API:\n`)

      if (regions && regions.length > 0) {
        regions.forEach(region => {
          console.log(`📍 Region: ${region.name}`)
          console.log(`   ID: ${region.id}`)
          console.log(`   Currency: ${region.currency_code}`)
          console.log(`   Countries: ${region.countries?.map(c => c.iso_2).join(', ') || 'none'}`)
          console.log(`   Tax Rate: ${region.tax_rate}%`)
          console.log('')
        })
      } else {
        console.log('❌ No regions found in store API')
        console.log('\n⚠️  This is the issue - no regions are configured!')
        console.log('Need to create regions in the Medusa admin panel')
      }
    } else {
      console.log('❌ Failed to fetch regions:', storeResponse.status, storeResponse.statusText)
      const error = await storeResponse.text()
      console.log('Error:', error)
    }

  } catch (error) {
    console.error('❌ Error checking regions:', error.message)
  }
}

checkRegions()