/**
 * Fix Stripe Payment Provider Configuration
 *
 * This script addresses the critical issue where the USD region
 * has no payment providers configured, causing Stripe payment
 * session creation to fail in production.
 */

import { MedusaAppType } from "@medusajs/framework"

async function fixStripePaymentProvider() {
  console.log('🔧 Fixing Stripe Payment Provider Configuration...')
  console.log('=================================================')

  try {
    // Initialize Medusa app
    const { medusaApp } = await import("@medusajs/framework")
    const app = await medusaApp({
      loadEnv: process.env.NODE_ENV || "development"
    }) as MedusaAppType

    // Get the container
    const container = app.container

    // Get services
    const regionService = container.resolve("regionService")
    const paymentProviderService = container.resolve("paymentProviderService")

    // Get the USD region
    console.log('📍 Finding USD region...')
    const regions = await regionService.list({ currency_code: "usd" })

    if (regions.length === 0) {
      console.error('❌ No USD region found!')
      process.exit(1)
    }

    const usdRegion = regions[0]
    console.log(`✅ Found USD region: ${usdRegion.id} - ${usdRegion.name}`)

    // Check current payment providers
    console.log('💳 Checking current payment providers...')
    const currentProviders = usdRegion.payment_providers || []
    console.log(`Current providers: ${currentProviders.length > 0 ? currentProviders.map((p: any) => p.id).join(', ') : 'None'}`)

    // Get available payment providers
    console.log('🔍 Finding available payment providers...')
    const availableProviders = await paymentProviderService.list()
    console.log(`Available providers: ${availableProviders.map((p: any) => p.id).join(', ')}`)

    // Find Stripe provider
    const stripeProvider = availableProviders.find((p: any) => p.id === 'stripe')

    if (!stripeProvider) {
      console.error('❌ Stripe payment provider not found!')
      console.log('Available providers:', availableProviders.map((p: any) => p.id))
      process.exit(1)
    }

    console.log(`✅ Found Stripe provider: ${stripeProvider.id}`)

    // Check if Stripe is already added to the region
    const hasStripeProvider = currentProviders.some((p: any) => p.id === 'stripe')

    if (hasStripeProvider) {
      console.log('✅ Stripe provider already configured for USD region!')
    } else {
      console.log('➕ Adding Stripe provider to USD region...')

      try {
        await regionService.addPaymentProvider(usdRegion.id, 'stripe')
        console.log('✅ Successfully added Stripe provider to USD region!')
      } catch (error) {
        console.error('❌ Failed to add Stripe provider:', error)

        // Try alternative method - update region directly
        console.log('🔄 Trying alternative method...')
        const updatedProviders = [...currentProviders, stripeProvider]
        await regionService.update(usdRegion.id, {
          payment_providers: updatedProviders
        })
        console.log('✅ Successfully updated region with Stripe provider!')
      }
    }

    // Verify the fix
    console.log('✅ Verifying configuration...')
    const verifyRegion = await regionService.retrieve(usdRegion.id, {
      relations: ['payment_providers']
    })

    const verifyProviders = verifyRegion.payment_providers || []
    console.log(`Final payment providers: ${verifyProviders.map((p: any) => p.id).join(', ')}`)

    if (verifyProviders.some((p: any) => p.id === 'stripe')) {
      console.log('🎉 SUCCESS: Stripe provider is now configured!')
      console.log('💡 Payment sessions should now work correctly.')
    } else {
      console.error('❌ FAILED: Stripe provider still not found in region')
      process.exit(1)
    }

    console.log('=================================================')
    console.log('✅ Stripe Payment Provider Fix Complete!')

  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  fixStripePaymentProvider()
    .then(() => {
      console.log('✨ Script completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed with error:', error)
      process.exit(1)
    })
}

export default fixStripePaymentProvider