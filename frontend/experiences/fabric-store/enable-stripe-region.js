// Script to enable Stripe payment provider for USD region
// This bypasses the admin UI which has authentication issues

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function enableStripeInRegion() {
  console.log('🔧 Attempting to enable Stripe for USD region...\n')

  // First, get admin token
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
  console.log('✅ Admin authentication successful')

  // Try to update region with Stripe
  const regionId = 'reg_01K5DB032EF34GSDPW8DK7C20V'

  // Attempt to update region via admin API
  const updateRes = await fetch(`${MEDUSA_URL}/admin/regions/${regionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      payment_providers: ['stripe']
    })
  })

  if (updateRes.ok) {
    console.log('✅ Stripe enabled for USD region!')
  } else {
    const error = await updateRes.text()
    console.log('❌ Failed to update region:', error.substring(0, 200))

    console.log('\n📝 Manual steps required:')
    console.log('1. Access Railway dashboard')
    console.log('2. Go to the PostgreSQL database')
    console.log('3. Run this SQL:')
    console.log(`
      -- Enable Stripe for the USD region
      INSERT INTO region_payment_providers (region_id, payment_provider_id)
      VALUES ('${regionId}', 'stripe')
      ON CONFLICT DO NOTHING;
    `)
  }
}

enableStripeInRegion().catch(console.error)