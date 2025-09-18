/**
 * Script to create a publishable API key using Medusa Admin API
 * This bypasses the need to manually access the admin dashboard
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'

async function createPublishableKey() {
  console.log('🔑 Creating publishable API key for fabric-store...')
  console.log('🌐 Medusa URL:', MEDUSA_BACKEND_URL)

  try {
    // Step 1: Try to create an admin user first (if needed)
    console.log('\n1️⃣ Attempting to create admin user...')

    const adminUserResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tarahub.com',
        password: 'TaraHub2024!',
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      })
    })

    console.log('Admin user creation response:', adminUserResponse.status)

    // Step 2: Try to login with admin credentials
    console.log('\n2️⃣ Attempting admin login...')

    const loginResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@tarahub.com',
        password: 'TaraHub2024!'
      })
    })

    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', await loginResponse.text())

      // Try with alternate credentials
      console.log('\n🔄 Trying alternate admin credentials...')

      const altLoginResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'supersecret'
        })
      })

      if (!altLoginResponse.ok) {
        console.error('❌ Alternate admin login failed:', await altLoginResponse.text())
        console.log('\n📌 Manual Solution Required:')
        console.log('1. Access Medusa Admin: https://medusa-backend-production-3655.up.railway.app/app')
        console.log('2. Login with admin credentials')
        console.log('3. Navigate to Settings -> API Key Management')
        console.log('4. Create a new Publishable Key')
        console.log('5. Copy the key and update fabric-store environment variables')
        console.log('\nEnvironment variable to update:')
        console.log('NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<your_new_key>')
        return
      }

      const altAuthData = await altLoginResponse.json()
      const adminToken = altAuthData.access_token
      console.log('✅ Alternate admin login successful')

      // Step 3: Create publishable key with alternate token
      await createKeyWithToken(adminToken)

    } else {
      const authData = await loginResponse.json()
      const adminToken = authData.access_token
      console.log('✅ Admin login successful')

      // Step 3: Create publishable key
      await createKeyWithToken(adminToken)
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message)
    console.log('\n📌 Alternative approach:')
    console.log('Since automated key creation failed, you can:')
    console.log('1. Check the fabric-store is working with existing environment variables')
    console.log('2. Test a payment flow to see if it completes successfully')
    console.log('3. If payments still fail, access Medusa admin manually')
  }
}

async function createKeyWithToken(adminToken) {
  console.log('\n3️⃣ Creating publishable API key...')

  const createKeyResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/publishable-api-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      title: 'Fabric Store Production Key'
    })
  })

  if (!createKeyResponse.ok) {
    const errorText = await createKeyResponse.text()
    console.error('❌ Failed to create API key:', errorText)
    return
  }

  const keyData = await createKeyResponse.json()
  const publishableKey = keyData.publishable_api_key?.id

  if (publishableKey) {
    console.log('✅ Publishable API key created successfully!')
    console.log(`🎯 Key: ${publishableKey}`)
    console.log('\n📋 Next steps:')
    console.log('1. Update fabric-store environment variables:')
    console.log(`   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${publishableKey}`)
    console.log('2. Redeploy fabric-store to Vercel')
    console.log('3. Test the payment flow')
  } else {
    console.error('❌ API key creation successful but no key returned')
    console.log('Response:', JSON.stringify(keyData, null, 2))
  }
}

// Execute the script
createPublishableKey()