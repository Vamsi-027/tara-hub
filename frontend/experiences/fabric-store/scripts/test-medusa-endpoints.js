/**
 * Script to test production Medusa backend endpoints
 * Debug the payment session API issue
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function testMedusaEndpoints() {
  console.log('🔍 Testing Medusa backend endpoints...')
  console.log('🌐 Backend URL:', MEDUSA_BACKEND_URL)
  console.log('')

  try {
    // Test 1: Check if backend is responding
    console.log('1️⃣ Testing backend health...')
    const healthResponse = await fetch(`${MEDUSA_BACKEND_URL}/health`)

    if (healthResponse.ok) {
      const healthData = await healthResponse.text()
      console.log('✅ Backend is healthy:', healthData)
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status)
    }

    // Test 2: List available store endpoints
    console.log('\n2️⃣ Testing store endpoints...')

    // Test regions endpoint
    const regionsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      }
    })

    if (regionsResponse.ok) {
      const regionsData = await regionsResponse.json()
      console.log('✅ Regions endpoint working, found', regionsData.regions?.length, 'regions')
    } else {
      console.log('❌ Regions endpoint failed:', regionsResponse.status)
    }

    // Test 3: Create a test cart
    console.log('\n3️⃣ Creating test cart...')
    const cartResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        email: 'test@example.com',
        region_id: 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ',
        currency_code: 'usd'
      })
    })

    if (!cartResponse.ok) {
      console.log('❌ Cart creation failed:', await cartResponse.text())
      return
    }

    const { cart } = await cartResponse.json()
    console.log('✅ Test cart created:', cart.id)

    // Test 4: Try different payment session endpoints
    console.log('\n4️⃣ Testing payment session endpoints...')

    const paymentEndpoints = [
      `/store/carts/${cart.id}/payment-sessions`,      // Original endpoint
      `/store/carts/${cart.id}/payment-session`,       // Singular version
      `/store/payment-sessions`,                        // Alternative structure
      `/store/carts/${cart.id}/complete-cart`,         // Direct completion
      `/store/carts/${cart.id}/payment-collections`,   // v2 structure
    ]

    for (const endpoint of paymentEndpoints) {
      console.log(`\nTesting: ${endpoint}`)

      const testResponse = await fetch(`${MEDUSA_BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY,
        },
        body: JSON.stringify({})
      })

      if (testResponse.ok) {
        console.log(`✅ ${endpoint} - SUCCESS`)
        const data = await testResponse.json()
        console.log('Response:', data)
        break
      } else {
        const statusText = testResponse.status === 404 ? '404 Not Found' :
                         testResponse.status === 400 ? '400 Bad Request' :
                         testResponse.status === 500 ? '500 Server Error' :
                         `${testResponse.status} ${testResponse.statusText}`

        console.log(`❌ ${endpoint} - ${statusText}`)

        // Try to get error details for non-404 errors
        if (testResponse.status !== 404) {
          try {
            const errorText = await testResponse.text()
            if (errorText && !errorText.includes('<!DOCTYPE html>')) {
              console.log('   Error details:', errorText.substring(0, 200))
            }
          } catch {}
        }
      }
    }

    // Test 5: Check available API routes
    console.log('\n5️⃣ Checking API documentation...')
    const docsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store`)

    if (docsResponse.ok) {
      console.log('✅ Store API base endpoint accessible')
    } else {
      console.log('❌ Store API base endpoint failed')
    }

    // Test 6: Try to fetch the created cart
    console.log('\n6️⃣ Fetching cart details...')
    const cartDetailsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      }
    })

    if (cartDetailsResponse.ok) {
      const cartDetails = await cartDetailsResponse.json()
      console.log('✅ Cart details retrieved')
      console.log('   Payment sessions:', cartDetails.cart?.payment_sessions?.length || 0)
      console.log('   Available providers:', cartDetails.cart?.region?.payment_providers?.map(p => p.id) || [])
    } else {
      console.log('❌ Failed to fetch cart details')
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

// Run the test
testMedusaEndpoints()