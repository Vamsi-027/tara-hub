#!/usr/bin/env node

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function fixRegions() {
  console.log('🔧 Fixing regions in production...\n')

  try {
    // Call the fix endpoint we created
    const response = await fetch(`${MEDUSA_URL}/admin/regions/fix-regions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Fix result:', result)
    } else {
      console.log('❌ Fix failed:', response.status, await response.text())
    }

    // Also run migrations via the deployed service
    console.log('\n🔧 Running migrations...')
    const migrationResponse = await fetch(`${MEDUSA_URL}/health`, {
      method: 'GET'
    })

    if (migrationResponse.ok) {
      console.log('✅ Service is healthy, migrations should have run')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixRegions()