/**
 * Script to discover available API endpoints in production Medusa
 * Find the correct payment workflow for Medusa v2
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function discoverEndpoints() {
  console.log('🔍 Discovering Medusa API endpoints...')
  console.log('')

  try {
    // Try to access potential payment-related endpoints
    const endpointsToTest = [
      // Different payment approaches
      '/store/payment-providers',
      '/store/payment-collections',
      '/admin/payment-providers',

      // Cart operations
      '/store/carts/complete',

      // Alternative payment workflows
      '/store/payments',
      '/store/payment-intents',

      // Check what happens with direct completion
      '/store/orders',

      // Admin endpoints (might need different auth)
      '/admin/regions',
      '/admin/payment-providers',
    ]

    console.log('🔍 Testing potential endpoints...')

    for (const endpoint of endpointsToTest) {
      try {
        const response = await fetch(`${MEDUSA_BACKEND_URL}${endpoint}`, {
          headers: {
            'x-publishable-api-key': PUBLISHABLE_KEY,
          }
        })

        if (response.ok) {
          console.log(`✅ ${endpoint} - Available`)

          if (endpoint.includes('payment')) {
            try {
              const data = await response.json()
              console.log(`   Data:`, Object.keys(data))
            } catch (e) {
              console.log(`   Response: TEXT`)
            }
          }
        } else if (response.status === 401) {
          console.log(`🔐 ${endpoint} - Requires authentication`)
        } else if (response.status === 405) {
          console.log(`⚠️ ${endpoint} - Method not allowed (try POST)`)
        } else {
          console.log(`❌ ${endpoint} - ${response.status}`)
        }
      } catch (error) {
        console.log(`💥 ${endpoint} - Error: ${error.message}`)
      }
    }

    // Test creating a cart and see what methods are available
    console.log('\n🛒 Testing cart workflow...')

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

    if (cartResponse.ok) {
      const { cart } = await cartResponse.json()
      console.log('✅ Cart created:', cart.id)

      // Try different cart operations
      const cartOperations = [
        { method: 'GET', path: `/store/carts/${cart.id}` },
        { method: 'POST', path: `/store/carts/${cart.id}/complete` },
        { method: 'POST', path: `/store/carts/${cart.id}/payment` },
        { method: 'GET', path: `/store/carts/${cart.id}/payment-methods` },
      ]

      console.log('\n🔧 Testing cart operations...')

      for (const op of cartOperations) {
        try {
          const opResponse = await fetch(`${MEDUSA_BACKEND_URL}${op.path}`, {
            method: op.method,
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': PUBLISHABLE_KEY,
            },
            ...(op.method === 'POST' ? { body: JSON.stringify({}) } : {})
          })

          if (opResponse.ok) {
            console.log(`✅ ${op.method} ${op.path} - Success`)

            if (op.method === 'GET') {
              try {
                const data = await opResponse.json()
                if (data.cart && data.cart.payment_sessions) {
                  console.log(`   Payment sessions: ${data.cart.payment_sessions.length}`)
                }
              } catch (e) {}
            }
          } else {
            console.log(`❌ ${op.method} ${op.path} - ${opResponse.status}`)
          }
        } catch (error) {
          console.log(`💥 ${op.method} ${op.path} - Error`)
        }
      }
    }

    // Test alternative payment workflow - direct Stripe integration
    console.log('\n💳 Testing direct payment completion...')

    // Try to complete cart without payment session
    const cartId = 'cart_01K5F64B98CCR7TBCBBJHMRJ32' // From the error log

    const directCompleteResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cartId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY,
      }
    })

    if (directCompleteResponse.ok) {
      console.log('✅ Direct cart completion works!')
      const data = await directCompleteResponse.json()
      console.log('Result:', data)
    } else {
      const errorText = await directCompleteResponse.text()
      console.log('❌ Direct completion failed:')
      console.log('Response:', errorText.substring(0, 200))
    }

  } catch (error) {
    console.error('❌ Discovery failed:', error.message)
  }
}

// Run discovery
discoverEndpoints()