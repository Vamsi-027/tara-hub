#!/usr/bin/env node

const MEDUSA_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = 'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

async function checkStripeConfig() {
  console.log('🔍 Checking Stripe configuration in Medusa...\n')

  try {
    // Check available payment providers
    console.log('1. Checking payment providers...')
    const regionsResponse = await fetch(`${MEDUSA_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY
      }
    })

    if (regionsResponse.ok) {
      const { regions } = await regionsResponse.json()
      console.log(`Found ${regions?.length || 0} regions`)

      regions?.forEach(region => {
        console.log(`\n📍 Region: ${region.name}`)
        console.log(`   Payment Providers: ${region.payment_providers?.map(p => p.id || p).join(', ') || 'none'}`)
      })
    }

    // Test creating a cart and payment session
    console.log('\n2. Testing cart and payment session creation...')

    // Create a cart
    const cartResponse = await fetch(`${MEDUSA_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        region_id: 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ', // US region
        currency_code: 'usd'
      })
    })

    if (!cartResponse.ok) {
      console.error('❌ Failed to create cart:', await cartResponse.text())
      return
    }

    const { cart } = await cartResponse.json()
    console.log('✅ Cart created:', cart.id)

    // Try to create payment collection
    console.log('\n3. Creating payment collection...')
    const paymentCollectionResponse = await fetch(`${MEDUSA_URL}/store/payment-collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      },
      body: JSON.stringify({
        cart_id: cart.id
      })
    })

    if (!paymentCollectionResponse.ok) {
      console.error('❌ Failed to create payment collection:', await paymentCollectionResponse.text())
      return
    }

    const { payment_collection } = await paymentCollectionResponse.json()
    console.log('✅ Payment collection created:', payment_collection.id)

    // Try different provider IDs
    console.log('\n4. Testing Stripe provider IDs...')
    const providerIds = ['stripe', 'pp_stripe_stripe', 'manual']

    for (const providerId of providerIds) {
      console.log(`\n   Testing provider ID: "${providerId}"`)

      const sessionResponse = await fetch(`${MEDUSA_URL}/store/payment-collections/${payment_collection.id}/payment-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY
        },
        body: JSON.stringify({
          provider_id: providerId
        })
      })

      if (sessionResponse.ok) {
        console.log(`   ✅ Success with provider ID: "${providerId}"`)
        const data = await sessionResponse.json()
        const session = data.payment_collection?.payment_sessions?.find(s => s.provider_id === providerId)
        if (session?.data?.client_secret) {
          console.log(`   ✅ Got client_secret: ${session.data.client_secret.substring(0, 20)}...`)
        } else {
          console.log(`   ⚠️  No client_secret in response`)
        }
        break
      } else {
        const error = await sessionResponse.text()
        console.log(`   ❌ Failed: ${error.substring(0, 100)}...`)
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }

  console.log('\n\n📝 Next Steps:')
  console.log('1. Ensure STRIPE_API_KEY is set in Medusa backend environment')
  console.log('2. Ensure NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set in frontend')
  console.log('3. Use the correct provider_id that worked above')
}

checkStripeConfig()