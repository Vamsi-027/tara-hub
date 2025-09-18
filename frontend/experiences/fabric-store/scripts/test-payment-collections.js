/**
 * Test Medusa v2 payment collections workflow
 * Find the correct way to initialize payments
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function testPaymentCollections() {
  console.log('🔍 Testing Medusa v2 payment collections workflow...')
  console.log('')

  try {
    // First check payment providers
    console.log('1️⃣ Testing payment providers endpoint...')

    const providersResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-providers`, {
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      }
    })

    if (providersResponse.ok) {
      const providersData = await providersResponse.json()
      console.log('✅ Payment providers available:', providersData)
    } else {
      console.log('❌ Payment providers endpoint failed:', providersResponse.status)
      const errorText = await providersResponse.text()
      console.log('Error:', errorText.substring(0, 300))
    }

    // Create a test cart with items
    console.log('\n2️⃣ Creating cart with items...')

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

    // Try to add a line item to make the cart valid for payment
    console.log('\n3️⃣ Adding line item to cart...')

    // Get available products first
    const productsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/products?limit=1`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
      }
    })

    if (productsResponse.ok) {
      const { products } = await productsResponse.json()
      if (products && products.length > 0) {
        const product = products[0]
        const variant = product.variants?.[0]

        if (variant) {
          console.log(`   Adding variant: ${variant.id}`)

          const addItemResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/line-items`, {
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

          if (addItemResponse.ok) {
            console.log('✅ Line item added to cart')
          } else {
            console.log('❌ Failed to add line item:', await addItemResponse.text())
          }
        }
      }
    }

    // Try different approaches to initialize payment
    console.log('\n4️⃣ Testing payment initialization approaches...')

    const paymentInitApproaches = [
      {
        name: 'Initialize payment collection',
        endpoint: `/store/carts/${cart.id}/payment-collection`,
        method: 'POST',
        body: {}
      },
      {
        name: 'Create payment collection',
        endpoint: `/store/payment-collections`,
        method: 'POST',
        body: { cart_id: cart.id }
      },
      {
        name: 'Initialize payment',
        endpoint: `/store/carts/${cart.id}/payment`,
        method: 'POST',
        body: { provider_id: 'stripe' }
      },
      {
        name: 'Create payment session (v2)',
        endpoint: `/store/carts/${cart.id}/payment-session`,
        method: 'POST',
        body: { provider_id: 'stripe' }
      }
    ]

    for (const approach of paymentInitApproaches) {
      console.log(`\nTesting: ${approach.name}`)

      try {
        const response = await fetch(`${MEDUSA_BACKEND_URL}${approach.endpoint}`, {
          method: approach.method,
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': PUBLISHABLE_KEY,
          },
          body: JSON.stringify(approach.body)
        })

        if (response.ok) {
          console.log(`✅ ${approach.name} - SUCCESS!`)
          const data = await response.json()
          console.log('Response:', JSON.stringify(data, null, 2))

          // If this worked, try to complete the cart
          console.log('\n5️⃣ Trying to complete cart after payment init...')
          const completeResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': PUBLISHABLE_KEY,
            }
          })

          if (completeResponse.ok) {
            console.log('✅ Cart completion successful!')
          } else {
            const completeError = await completeResponse.text()
            console.log('❌ Cart completion still failed:', completeError.substring(0, 200))
          }

          break
        } else {
          console.log(`❌ ${approach.name} - ${response.status}`)

          if (response.status !== 404) {
            const errorText = await response.text()
            if (!errorText.includes('<!DOCTYPE html>')) {
              console.log(`   Error: ${errorText.substring(0, 150)}`)
            }
          }
        }
      } catch (error) {
        console.log(`💥 ${approach.name} - Error: ${error.message}`)
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testPaymentCollections()