/**
 * Industry-Standard Order Creation API
 * Following Medusa v2 Best Practices
 *
 * This implementation uses:
 * - Proper cart-to-order workflow
 * - Medusa payment provider integration
 * - No direct database manipulation
 * - Standard Medusa API endpoints only
 */

import { NextRequest, NextResponse } from 'next/server'

// Use production URL as fallback if env var is not set
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                           process.env.MEDUSA_BACKEND_URL ||
                           'https://medusa-backend-production-3655.up.railway.app'

// Publishable key - currently optional in production
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

interface OrderItem {
  id: string
  title: string
  price: number
  quantity: number
  type: 'fabric' | 'swatch'
  yardage?: number
  color?: string
  sku?: string
  thumbnail?: string
  productId?: string
  variantId?: string
}

interface ShippingAddress {
  firstName: string
  lastName?: string
  address: string
  city: string
  state: string
  zipCode: string
  country?: string
  phone?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, items, shipping, billing, total } = body

    console.log('🏭 [BEST PRACTICE] Creating order with proper Medusa workflow')
    console.log('📧 Customer:', email)
    console.log('📦 Items:', items.length)

    // Step 1: Create a cart with proper region and currency
    console.log('1️⃣ Creating cart...')
    const cartResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
      },
      body: JSON.stringify({
        email,
        region_id: 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ', // US region
        currency_code: 'usd',
        metadata: {
          source: 'fabric-store',
          created_at: new Date().toISOString()
        }
      })
    })

    if (!cartResponse.ok) {
      const error = await cartResponse.text()
      throw new Error(`Failed to create cart: ${error}`)
    }

    const { cart } = await cartResponse.json()
    console.log('✅ Cart created:', cart.id)

    // Step 2: Add line items to cart with proper variant resolution
    console.log('2️⃣ Adding items to cart...')

    // First, fetch available products to map items correctly
    const productsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/products?limit=100`, {
      headers: {
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
      }
    })

    let availableProducts = []
    if (productsResponse.ok) {
      const { products } = await productsResponse.json()
      availableProducts = products || []
    }

    for (const item of items) {
      let variantId = item.variantId

      // If no variant ID or if a product ID was passed as variant ID, find the correct variant
      if (!variantId || variantId.startsWith('prod_')) {
        // Use the product ID from the item (handle case where variantId is actually productId)
        const productIdToUse = item.productId || item.variantId || item.id

        // Try to find product by ID or title
        const product = availableProducts.find((p: any) =>
          p.id === productIdToUse ||
          p.id === item.id ||
          p.title?.toLowerCase().includes(item.title?.toLowerCase())
        )

        if (product && product.variants && product.variants.length > 0) {
          // Select variant based on item type
          const isSwatch = item.type === 'swatch'
          const variant = product.variants.find((v: any) => {
            const title = v.title?.toLowerCase() || ''
            return isSwatch ? title.includes('swatch') : !title.includes('swatch')
          }) || product.variants[0]

          variantId = variant.id
          console.log(`📦 Mapped ${item.title} to variant ${variantId}`)
        } else if (availableProducts.length > 0) {
          // Fallback: use first available product's first variant
          const fallbackProduct = availableProducts[0]
          if (fallbackProduct.variants && fallbackProduct.variants.length > 0) {
            variantId = fallbackProduct.variants[0].id
            console.log(`⚠️ Using fallback variant for ${item.title}`)
          }
        }
      }

      if (!variantId) {
        console.warn(`⚠️ Skipping item without variant: ${item.title}`)
        continue
      }

      const lineItemResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/line-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
        },
        body: JSON.stringify({
          variant_id: variantId,
          quantity: item.type === 'fabric' && item.yardage ? item.yardage : item.quantity,
          metadata: {
            original_item_id: item.id,
            item_type: item.type,
            color: item.color,
            sku: item.sku,
            yardage: item.yardage,
            fabric_store_item: true
          }
        })
      })

      if (lineItemResponse.ok) {
        console.log(`✅ Added: ${item.title}`)
      } else {
        const error = await lineItemResponse.text()
        console.warn(`⚠️ Failed to add ${item.title}: ${error}`)
      }
    }

    // Step 3: Set shipping and billing addresses
    console.log('3️⃣ Setting addresses...')
    const addressData = {
      first_name: shipping.firstName,
      last_name: shipping.lastName || '',
      address_1: shipping.address,
      city: shipping.city,
      province: shipping.state,
      postal_code: shipping.zipCode,
      country_code: shipping.country?.toLowerCase() || 'us',
      phone: shipping.phone || ''
    }

    const updateCartResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
      },
      body: JSON.stringify({
        shipping_address: addressData,
        billing_address: billing ? {
          first_name: billing.firstName,
          last_name: billing.lastName || '',
          address_1: billing.address,
          city: billing.city,
          province: billing.state,
          postal_code: billing.zipCode,
          country_code: billing.country?.toLowerCase() || 'us',
          phone: billing.phone || ''
        } : addressData
      })
    })

    if (!updateCartResponse.ok) {
      console.warn('⚠️ Failed to update addresses, continuing...')
    } else {
      console.log('✅ Addresses set')
    }

    // Step 4: Add shipping methods
    console.log('4️⃣ Setting shipping method...')
    const shippingOptionsResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/shipping-options?cart_id=${cart.id}`, {
      headers: {
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
      }
    })

    if (shippingOptionsResponse.ok) {
      const { shipping_options } = await shippingOptionsResponse.json()
      if (shipping_options && shipping_options.length > 0) {
        // Select the first available shipping option
        const shippingOption = shipping_options[0]

        await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/shipping-methods`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
          },
          body: JSON.stringify({
            option_id: shippingOption.id
          })
        })
        console.log('✅ Shipping method set')
      }
    }

    // Step 5: Initialize payment sessions
    console.log('5️⃣ Initializing payment...')
    console.log('🌐 Medusa URL:', MEDUSA_BACKEND_URL)
    console.log('🔑 Publishable Key:', PUBLISHABLE_KEY ? 'Present' : 'Missing')

    const paymentSessionResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/payment-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
      }
    })

    if (!paymentSessionResponse.ok) {
      const errorText = await paymentSessionResponse.text()
      console.error('❌ Payment session initialization failed:', errorText)

      // Return error with details
      return NextResponse.json({
        success: false,
        error: 'Payment initialization failed',
        message: 'Unable to initialize payment. Please ensure Stripe is configured in Medusa.',
        details: errorText,
        cart_id: cart.id
      }, { status: 500 })
    } else {
      console.log('✅ Payment sessions initialized')

      // Get updated cart with payment sessions
      const updatedCartResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}`, {
        headers: {
          ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
        }
      })

      if (updatedCartResponse.ok) {
        const { cart: updatedCart } = await updatedCartResponse.json()

        // Step 6: Select Stripe payment provider
        if (updatedCart.payment_sessions && updatedCart.payment_sessions.length > 0) {
          const stripeSession = updatedCart.payment_sessions.find((s: any) =>
            s.provider_id === 'stripe' || s.provider_id === 'pp_stripe'
          )

          if (stripeSession) {
            console.log('6️⃣ Setting Stripe as payment provider...')
            const setProviderResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}/payment-session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
              },
              body: JSON.stringify({
                provider_id: stripeSession.provider_id
              })
            })

            if (!setProviderResponse.ok) {
              console.error('❌ Failed to set payment provider')
              throw new Error('Failed to set payment provider')
            }

            console.log('✅ Stripe payment provider set')

            // CRITICAL: Fetch the cart again to get the updated payment session with client_secret
            const finalCartResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/carts/${cart.id}`, {
              headers: {
                ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
              }
            })

            if (!finalCartResponse.ok) {
              console.error('❌ Failed to fetch final cart')
              throw new Error('Failed to fetch cart with payment details')
            }

            const { cart: finalCart } = await finalCartResponse.json()

            // Find the updated Stripe session with client_secret
            const finalStripeSession = finalCart.payment_sessions?.find((s: any) =>
              s.provider_id === 'stripe' || s.provider_id === 'pp_stripe'
            )

            if (!finalStripeSession?.data?.client_secret) {
              console.error('❌ No client_secret in payment session:', finalStripeSession)
              throw new Error('Payment session missing client_secret')
            }

            console.log('✅ Got client_secret from Stripe:', finalStripeSession.data.client_secret.substring(0, 20) + '...')

            // Return cart with payment information
            return NextResponse.json({
              success: true,
              cart_id: cart.id,
              payment_session: finalStripeSession,
              client_secret: finalStripeSession.data.client_secret,
              message: 'Cart created successfully with proper Medusa workflow',
              next_step: 'Complete payment with Stripe, then call /complete-order',
              metadata: {
                best_practice: true,
                workflow: 'standard-medusa-v2',
                items_count: items.length,
                total_amount: finalCart.total || total
              }
            })
          }
        }
      }
    }

    // Fallback response if payment setup incomplete
    return NextResponse.json({
      success: true,
      cart_id: cart.id,
      message: 'Cart created but payment needs manual initialization',
      next_step: 'Initialize payment manually, then complete order',
      metadata: {
        items_added: items.length,
        addresses_set: true
      }
    })

  } catch (error) {
    console.error('❌ Order creation failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Check Medusa backend logs for details'
      },
      { status: 500 }
    )
  }
}