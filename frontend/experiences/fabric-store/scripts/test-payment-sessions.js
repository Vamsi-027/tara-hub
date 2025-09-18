/**
 * Test adding payment sessions to payment collection
 * Complete the Medusa v2 payment workflow
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function testPaymentSessions() {
  console.log('🔍 Testing payment sessions in payment collection...')
  console.log('')

  try {
    // Step 1: Create cart with item
    console.log('1️⃣ Creating cart with item...')

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
      console.log('❌ Cart creation failed')
      return
    }

    const { cart } = await cartResponse.json()
    console.log('✅ Cart created:', cart.id)

    // Add line item
    const productsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/products?limit=1`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    })

    if (productsResponse.ok) {
      const { products } = await productsResponse.json()
      if (products?.[0]?.variants?.[0]) {
        const variant = products[0].variants[0]

        await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/line-items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            variant_id: variant.id,
            quantity: 1
          })
        })
        console.log('✅ Line item added')
      }
    }

    // Step 2: Create payment collection
    console.log('\n2️⃣ Creating payment collection...')

    const paymentCollectionResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ cart_id: cart.id })
    })

    if (!paymentCollectionResponse.ok) {
      console.log('❌ Payment collection creation failed')
      return
    }

    const { payment_collection } = await paymentCollectionResponse.json()
    console.log('✅ Payment collection created:', payment_collection.id)

    // Step 3: Try to add payment sessions to the collection
    console.log('\n3️⃣ Testing payment session initialization...')

    const sessionEndpoints = [
      {
        name: 'Add sessions to collection',
        endpoint: `/store/payment-collections/${payment_collection.id}/payment-sessions`,
        body: {}
      },
      {
        name: 'Initialize with provider',
        endpoint: `/store/payment-collections/${payment_collection.id}/payment-sessions`,
        body: { provider_id: 'stripe' }
      },
      {
        name: 'Initialize all providers',
        endpoint: `/store/payment-collections/${payment_collection.id}/payment-sessions`,
        body: { providers: ['stripe'] }
      },
      {
        name: 'Region-based init',
        endpoint: `/store/payment-collections/${payment_collection.id}/payment-sessions`,
        body: { region_id: 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ' }
      }
    ]

    for (const endpoint of sessionEndpoints) {
      console.log(`\nTesting: ${endpoint.name}`)

      try {
        const response = await fetch(`${MEDUSA_BACKEND_URL}${endpoint.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': PUBLISHABLE_KEY,
          },
          body: JSON.stringify(endpoint.body)
        })

        if (response.ok) {
          console.log(`✅ ${endpoint.name} - SUCCESS!`)
          const data = await response.json()
          console.log('Sessions created:', data.payment_collection?.payment_sessions?.length || 0)

          if (data.payment_collection?.payment_sessions?.length > 0) {
            console.log('Session details:', data.payment_collection.payment_sessions.map(s => ({
              provider: s.provider_id,
              status: s.status,
              has_data: !!s.data
            })))

            // Step 4: Try to complete cart now
            console.log('\n4️⃣ Attempting cart completion...')

            const completeResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': PUBLISHABLE_KEY,
              }
            })

            if (completeResponse.ok) {
              console.log('🎉 CART COMPLETION SUCCESSFUL!')
              const orderData = await completeResponse.json()
              console.log('Order created:', orderData.order?.id)
              return
            } else {
              const error = await completeResponse.text()
              console.log('❌ Still failed to complete:', error.substring(0, 200))
            }
          }

          break
        } else {
          console.log(`❌ ${endpoint.name} - ${response.status}`)

          if (response.status !== 404) {
            const errorText = await response.text()
            if (!errorText.includes('<!DOCTYPE html>')) {
              console.log(`   Error: ${errorText.substring(0, 100)}`)
            }
          }
        }
      } catch (error) {
        console.log(`💥 ${endpoint.name} - Error: ${error.message}`)
      }
    }

    // Step 5: Check current payment collection status
    console.log('\n5️⃣ Checking final payment collection status...')

    const statusResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-collections/${payment_collection.id}`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    })

    if (statusResponse.ok) {
      const statusData = await statusResponse.json()
      console.log('Final collection status:')
      console.log('- Sessions:', statusData.payment_collection?.payment_sessions?.length || 0)
      console.log('- Amount:', statusData.payment_collection?.amount)
      console.log('- Status:', statusData.payment_collection?.status)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testPaymentSessions()