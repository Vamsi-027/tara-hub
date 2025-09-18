/**
 * Find the correct payment provider IDs
 * Test with actual provider IDs from the region config
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function findCorrectProviders() {
  console.log('🔍 Finding correct payment provider IDs...')
  console.log('')

  try {
    // First check what providers are available in the region
    console.log('1️⃣ Checking region providers...')

    const regionsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/regions`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    })

    let availableProviders = []

    if (regionsResponse.ok) {
      const { regions } = await regionsResponse.json()
      const usRegion = regions.find(r => r.id === 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ')

      if (usRegion && usRegion.payment_providers) {
        availableProviders = usRegion.payment_providers.map(p => p.id)
        console.log('✅ Available providers in region:', availableProviders)
      } else {
        console.log('❌ No payment providers found in region')
      }
    }

    // Check payment providers endpoint with region filter
    console.log('\n2️⃣ Testing payment providers endpoint with region...')

    const providersResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-providers?region_id=reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ`, {
      headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
    })

    if (providersResponse.ok) {
      const providersData = await providersResponse.json()
      console.log('✅ Payment providers endpoint response:', providersData)
    } else {
      console.log('❌ Payment providers endpoint failed:', await providersResponse.text())
    }

    // Test with each available provider
    if (availableProviders.length > 0) {
      console.log('\n3️⃣ Testing payment collection with each provider...')

      // Create a test cart first
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
        console.log('✅ Test cart created:', cart.id)

        // Add a line item
        const productsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/products?limit=1`, {
          headers: { 'x-publishable-api-key': PUBLISHABLE_KEY }
        })

        if (productsResponse.ok) {
          const { products } = await productsResponse.json()
          if (products?.[0]?.variants?.[0]) {
            await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/line-items`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': PUBLISHABLE_KEY,
              },
              body: JSON.stringify({
                variant_id: products[0].variants[0].id,
                quantity: 1
              })
            })
            console.log('✅ Line item added')
          }
        }

        // Create payment collection
        const paymentCollectionResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-collections`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ cart_id: cart.id })
        })

        if (paymentCollectionResponse.ok) {
          const { payment_collection } = await paymentCollectionResponse.json()
          console.log('✅ Payment collection created:', payment_collection.id)

          // Test each provider
          for (const providerId of availableProviders) {
            console.log(`\nTesting provider: ${providerId}`)

            try {
              const sessionResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-collections/${payment_collection.id}/payment-sessions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-publishable-api-key': PUBLISHABLE_KEY,
                },
                body: JSON.stringify({ provider_id: providerId })
              })

              if (sessionResponse.ok) {
                console.log(`✅ ${providerId} - SUCCESS!`)
                const sessionData = await sessionResponse.json()
                console.log('   Sessions created:', sessionData.payment_collection?.payment_sessions?.length || 0)

                if (sessionData.payment_collection?.payment_sessions?.length > 0) {
                  const session = sessionData.payment_collection.payment_sessions[0]
                  console.log('   Session details:')
                  console.log('     - Provider:', session.provider_id)
                  console.log('     - Status:', session.status)
                  console.log('     - Has data:', !!session.data)

                  if (session.data && typeof session.data === 'object') {
                    console.log('     - Data keys:', Object.keys(session.data))
                    if (session.data.client_secret) {
                      console.log('     - Has client_secret:', session.data.client_secret.substring(0, 20) + '...')
                    }
                  }

                  // This is the working provider - let's try to complete the cart
                  console.log('\n🎯 Attempting cart completion with working provider...')

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
                    console.log('')
                    console.log('🔧 SOLUTION FOUND:')
                    console.log(`1. Create payment collection: POST /store/payment-collections`)
                    console.log(`2. Add payment session: POST /store/payment-collections/{id}/payment-sessions`)
                    console.log(`3. Use provider_id: "${providerId}"`)
                    console.log(`4. Complete cart: POST /store/carts/{id}/complete`)
                    return
                  } else {
                    const error = await completeResponse.text()
                    console.log('❌ Cart completion failed:', error.substring(0, 150))
                  }
                }

                break // Found working provider, don't test others
              } else {
                const error = await sessionResponse.text()
                console.log(`❌ ${providerId} - ${sessionResponse.status}:`, error.substring(0, 100))
              }
            } catch (error) {
              console.log(`💥 ${providerId} - Error: ${error.message}`)
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
findCorrectProviders()