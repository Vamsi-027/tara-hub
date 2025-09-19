#!/usr/bin/env node

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function checkRegions() {
  console.log('🔍 Checking regions via admin API...\n')

  try {
    // First try without authentication to see what the endpoint returns
    const response = await fetch(`${MEDUSA_URL}/admin/regions`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('Response status:', response.status)
    const text = await response.text()

    try {
      const data = JSON.parse(text)
      console.log('Response:', JSON.stringify(data, null, 2))

      if (data.regions && data.regions.length > 0) {
        console.log('\n✅ Found regions:')
        data.regions.forEach(region => {
          console.log(`\n📍 ${region.name}`)
          console.log(`   ID: ${region.id}`)
          console.log(`   Currency: ${region.currency_code}`)
        })
      }
    } catch (e) {
      console.log('Raw response:', text)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkRegions()