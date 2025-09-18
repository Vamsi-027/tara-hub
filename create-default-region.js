// Create default USD region in Medusa after database reset
const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function createDefaultRegion() {
  console.log('🏗️ CREATING DEFAULT USD REGION IN MEDUSA\n')
  console.log('=' .repeat(60))

  // Login as admin
  console.log('1️⃣ Logging in as admin...')
  const loginRes = await fetch(`${MEDUSA_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@tara-hub.com',
      password: 'password'
    })
  })

  if (!loginRes.ok) {
    console.log('❌ Failed to login as admin')
    console.log('Status:', loginRes.status)
    const error = await loginRes.text()
    console.log('Error:', error)
    return
  }

  const { token } = await loginRes.json()
  console.log('✅ Admin authenticated')

  // Check if any regions exist
  console.log('\n2️⃣ Checking existing regions...')
  const regionsRes = await fetch(`${MEDUSA_URL}/admin/regions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })

  if (regionsRes.ok) {
    const { regions } = await regionsRes.json()
    console.log(`Found ${regions.length} existing regions`)

    if (regions.length > 0) {
      console.log('Existing regions:')
      regions.forEach(r => {
        console.log(`  - ${r.name} (${r.id}) - ${r.currency_code}`)
      })

      // Find USD region
      const usdRegion = regions.find(r => r.currency_code === 'usd')
      if (usdRegion) {
        console.log(`\n✅ USD region already exists: ${usdRegion.id}`)
        console.log(`\nUpdate your fabric-store .env.local with:`)
        console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_USD=${usdRegion.id}`)
        return
      }
    }
  }

  // Create default USD region
  console.log('\n3️⃣ Creating default USD region...')
  const createRegionRes = await fetch(`${MEDUSA_URL}/admin/regions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'United States',
      currency_code: 'usd',
      countries: ['us']
    })
  })

  if (createRegionRes.ok) {
    const { region } = await createRegionRes.json()
    console.log(`✅ Created USD region: ${region.id}`)
    console.log(`   Name: ${region.name}`)
    console.log(`   Currency: ${region.currency_code}`)
    console.log(`   Tax Rate: ${region.tax_rate}%`)

    console.log(`\n📝 UPDATE YOUR FABRIC-STORE CONFIG:`)
    console.log(`Add this to frontend/experiences/fabric-store/.env.local:`)
    console.log(`NEXT_PUBLIC_MEDUSA_REGION_ID_USD=${region.id}`)

    return region.id
  } else {
    const error = await createRegionRes.text()
    console.log(`❌ Failed to create region: ${error}`)
  }

  console.log('\n' + '=' .repeat(60))
  console.log('✅ Region setup complete!')
}

createDefaultRegion().catch(console.error)