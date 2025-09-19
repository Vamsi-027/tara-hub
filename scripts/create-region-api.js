#!/usr/bin/env node

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function createRegionViaAPI() {
  console.log('🌍 Creating region via Admin API...\n')

  try {
    // Step 1: Create admin user (if not exists)
    console.log('1. Creating/verifying admin user...')

    const registerResponse = await fetch(`${MEDUSA_URL}/auth/user/emailpass/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@tara-hub.com',
        password: 'medusa_admin_2024'
      })
    })

    if (registerResponse.ok) {
      console.log('   ✅ Admin user created')
    } else {
      console.log('   ℹ️  Admin user might already exist')
    }

    // Step 2: Login to get token
    console.log('\n2. Authenticating...')

    const loginResponse = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@tara-hub.com',
        password: 'medusa_admin_2024'
      })
    })

    if (!loginResponse.ok) {
      const error = await loginResponse.text()
      console.error('   ❌ Authentication failed:', error)
      return
    }

    const { token } = await loginResponse.json()
    console.log('   ✅ Authenticated successfully')

    // Step 3: Check existing regions
    console.log('\n3. Checking existing regions...')

    const regionsResponse = await fetch(`${MEDUSA_URL}/admin/regions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (regionsResponse.ok) {
      const { regions } = await regionsResponse.json()

      if (regions && regions.length > 0) {
        console.log(`   ✅ Found ${regions.length} existing regions:`)
        regions.forEach(r => {
          console.log(`      - ${r.name} (${r.id}) - ${r.currency_code}`)
        })
        console.log('\n✅ Regions already exist. No need to create.')
        return
      }
    }

    // Step 4: Create US region
    console.log('\n4. Creating US region...')

    const createRegionResponse = await fetch(`${MEDUSA_URL}/admin/regions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'United States',
        currency_code: 'USD',
        tax_rate: 0,
        payment_providers: ['manual'],
        fulfillment_providers: ['manual'],
        countries: ['us']
      })
    })

    if (!createRegionResponse.ok) {
      const error = await createRegionResponse.text()
      console.error('   ❌ Failed to create region:', error)

      // Try alternative approach
      console.log('\n   Trying with lowercase currency code...')

      const retry = await fetch(`${MEDUSA_URL}/admin/regions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'United States',
          currency_code: 'usd',
          tax_rate: 0,
          countries: ['us']
        })
      })

      if (retry.ok) {
        const { region } = await retry.json()
        console.log('   ✅ Region created:', region.id)
      } else {
        console.error('   ❌ Still failed:', await retry.text())
      }
    } else {
      const { region } = await createRegionResponse.json()
      console.log('   ✅ Region created successfully!')
      console.log(`      ID: ${region.id}`)
      console.log(`      Name: ${region.name}`)
      console.log(`      Currency: ${region.currency_code}`)
    }

    console.log('\n✨ Setup complete!')
    console.log('\nAdmin credentials:')
    console.log('  Email: admin@tara-hub.com')
    console.log('  Password: medusa_admin_2024')
    console.log(`\nAdmin panel: ${MEDUSA_URL}/app`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createRegionViaAPI()