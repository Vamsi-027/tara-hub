/**
 * Script to diagnose Stripe configuration in production
 * This checks if Stripe is properly set up in the Medusa backend
 */

const MEDUSA_BACKEND_URL = 'https://medusa-backend-production-3655.up.railway.app'
const PUBLISHABLE_KEY = '' // Try without publishable key first

async function checkStripeConfig() {
  console.log('🔍 Checking Stripe configuration in production Medusa backend...')
  console.log('🌐 Medusa URL:', MEDUSA_BACKEND_URL)
  console.log('🔑 Using Publishable Key:', PUBLISHABLE_KEY ? 'Present' : 'Missing')
  console.log('')

  try {
    // Step 1: Check if Stripe provider is available
    console.log('1️⃣ Checking payment providers...')
    const providersResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/payment-providers`, {
      headers: {
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {})
      }
    })

    if (providersResponse.ok) {
      const { payment_providers } = await providersResponse.json()
      console.log('✅ Available payment providers:', payment_providers?.map(p => p.id).join(', ') || 'None')

      const hasStripe = payment_providers?.some(p => p.id === 'stripe' || p.id === 'pp_stripe')
      if (hasStripe) {
        console.log('✅ Stripe provider is configured')
      } else {
        console.error('❌ Stripe provider NOT found!')
        console.log('Available providers:', JSON.stringify(payment_providers, null, 2))
      }
    } else {
      console.error('❌ Failed to fetch payment providers:', await providersResponse.text())
    }

    // Step 2: Create a test cart to check payment session creation
    console.log('\n2️⃣ Creating test cart...')
    const cartResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {})
      },
      body: JSON.stringify({
        email: 'test@example.com',
        region_id: 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ', // US region
        currency_code: 'usd'
      })
    })

    if (!cartResponse.ok) {
      console.error('❌ Failed to create cart:', await cartResponse.text())
      return
    }

    const { cart } = await cartResponse.json()
    console.log('✅ Test cart created:', cart.id)

    // Step 3: Try to initialize payment sessions
    console.log('\n3️⃣ Initializing payment sessions...')
    const paymentSessionResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/payment-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {})
      }
    })

    if (!paymentSessionResponse.ok) {
      const errorText = await paymentSessionResponse.text()
      console.error('❌ Failed to initialize payment sessions:', errorText)

      // Try to parse error
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.message?.includes('Stripe')) {
          console.error('\n⚠️ Stripe configuration issue detected!')
          console.error('Error message:', errorData.message)
          console.log('\nPossible solutions:')
          console.log('1. Check STRIPE_API_KEY is set in Medusa backend environment')
          console.log('2. Verify Stripe is enabled in medusa-config.js')
          console.log('3. Ensure medusa-payment-stripe plugin is installed')
          console.log('4. Check if Stripe webhook endpoint is configured')
        }
      } catch {}
    } else {
      console.log('✅ Payment sessions initialized successfully')

      // Get updated cart with payment sessions
      const updatedCartResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}`, {
        headers: {
          ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {})
        }
      })

      if (updatedCartResponse.ok) {
        const { cart: updatedCart } = await updatedCartResponse.json()
        const stripeSession = updatedCart.payment_sessions?.find(s =>
          s.provider_id === 'stripe' || s.provider_id === 'pp_stripe'
        )

        if (stripeSession) {
          console.log('✅ Stripe payment session found')
          console.log('Provider ID:', stripeSession.provider_id)
          console.log('Status:', stripeSession.status)
          console.log('Has client_secret:', !!stripeSession.data?.client_secret)

          if (!stripeSession.data?.client_secret) {
            console.error('⚠️ Warning: Stripe session exists but no client_secret!')
            console.log('This indicates Stripe is partially configured but not generating payment intents')
          }
        } else {
          console.error('❌ No Stripe payment session in cart')
          console.log('Available sessions:', updatedCart.payment_sessions?.map(s => s.provider_id))
        }
      }
    }

    // Step 4: Check region configuration
    console.log('\n4️⃣ Checking region configuration...')
    const regionsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/regions`, {
      headers: {
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {})
      }
    })

    if (regionsResponse.ok) {
      const { regions } = await regionsResponse.json()
      const usRegion = regions?.find(r => r.id === 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ')

      if (usRegion) {
        console.log('✅ US Region found')
        console.log('Currency:', usRegion.currency_code)
        console.log('Payment providers:', usRegion.payment_providers?.map(p => p.id).join(', '))

        const hasStripeInRegion = usRegion.payment_providers?.some(p =>
          p.id === 'stripe' || p.id === 'pp_stripe'
        )

        if (!hasStripeInRegion) {
          console.error('❌ Stripe is not enabled for US region!')
          console.log('This needs to be configured in Medusa admin or via API')
        }
      } else {
        console.error('❌ US region not found!')
      }
    }

    console.log('\n📊 Diagnosis Summary:')
    console.log('=====================================')
    console.log('If payment is failing, check:')
    console.log('1. STRIPE_API_KEY environment variable in Railway')
    console.log('2. Stripe plugin configuration in medusa-config.js')
    console.log('3. Region has Stripe payment provider enabled')
    console.log('4. Frontend Stripe publishable key matches backend configuration')

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
  }
}

// Run the diagnostic
checkStripeConfig()