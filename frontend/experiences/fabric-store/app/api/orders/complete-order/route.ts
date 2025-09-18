/**
 * Order Completion API
 * Completes the order after successful payment
 * Following Medusa v2 Best Practices
 */

import { NextRequest, NextResponse } from 'next/server'

// Use production URL as fallback if env var is not set
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                           process.env.MEDUSA_BACKEND_URL ||
                           'https://medusa-backend-production-3655.up.railway.app'

// Publishable key - currently optional in production
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cart_id, payment_intent_id } = body

    if (!cart_id) {
      return NextResponse.json(
        { success: false, error: 'Cart ID is required' },
        { status: 400 }
      )
    }

    console.log('🎯 [BEST PRACTICE] Completing order for cart:', cart_id)

    // Step 1: Update payment if payment_intent_id provided
    if (payment_intent_id) {
      console.log('💳 Updating payment with intent:', payment_intent_id)

      try {
        const paymentUpdateResponse = await fetch(
          `${MEDUSA_BACKEND_URL}/store/carts/${cart_id}/payment-session/update`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
            },
            body: JSON.stringify({
              data: {
                payment_intent_id
              }
            })
          }
        )

        if (paymentUpdateResponse.ok) {
          console.log('✅ Payment updated successfully')
        } else {
          console.warn('⚠️ Payment update failed, continuing...')
        }
      } catch (error) {
        console.warn('⚠️ Payment update error:', error)
      }
    }

    // Step 2: Complete the cart to create order
    console.log('🔄 Completing cart to create order...')

    const completeResponse = await fetch(
      `${MEDUSA_BACKEND_URL}/store/carts/${cart_id}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': PUBLISHABLE_KEY || '',
        }
      }
    )

    if (!completeResponse.ok) {
      const errorText = await completeResponse.text()
      console.error('❌ Cart completion failed:', errorText)

      // Try to get error details
      let errorMessage = 'Failed to complete order'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        errorMessage = errorText
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          cart_id,
          suggestion: 'Check payment status and cart validity'
        },
        { status: 500 }
      )
    }

    const completionData = await completeResponse.json()
    const order = completionData.order || completionData

    console.log('✅ Order created successfully:', order.id)

    // Step 3: Fetch complete order details
    let fullOrder = order
    try {
      const orderResponse = await fetch(
        `${MEDUSA_BACKEND_URL}/store/orders/${order.id}`,
        {
          headers: {
            'x-publishable-api-key': PUBLISHABLE_KEY || '',
          }
        }
      )

      if (orderResponse.ok) {
        const { order: fetchedOrder } = await orderResponse.json()
        fullOrder = fetchedOrder
        console.log('✅ Full order details retrieved')
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch full order details')
    }

    // Return the order details
    return NextResponse.json({
      success: true,
      order: {
        id: fullOrder.id,
        display_id: fullOrder.display_id,
        email: fullOrder.email,
        status: fullOrder.status,
        payment_status: fullOrder.payment_status,
        fulfillment_status: fullOrder.fulfillment_status,
        total: fullOrder.total,
        subtotal: fullOrder.subtotal,
        tax_total: fullOrder.tax_total,
        shipping_total: fullOrder.shipping_total,
        discount_total: fullOrder.discount_total,
        currency_code: fullOrder.currency_code,
        items: fullOrder.items || [],
        shipping_address: fullOrder.shipping_address,
        billing_address: fullOrder.billing_address,
        created_at: fullOrder.created_at,
        metadata: fullOrder.metadata
      },
      message: 'Order completed successfully using Medusa best practices',
      confirmation_number: fullOrder.display_id,
      next_steps: [
        'Send order confirmation email',
        'Track fulfillment status',
        'Monitor payment capture'
      ]
    })

  } catch (error) {
    console.error('❌ Order completion failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to complete order',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check order status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('order_id')

  if (!orderId) {
    return NextResponse.json(
      { success: false, error: 'Order ID is required' },
      { status: 400 }
    )
  }

  try {
    const orderResponse = await fetch(
      `${MEDUSA_BACKEND_URL}/store/orders/${orderId}`,
      {
        headers: {
          'x-publishable-api-key': PUBLISHABLE_KEY || '',
        }
      }
    )

    if (!orderResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const { order } = await orderResponse.json()

    return NextResponse.json({
      success: true,
      order,
      message: 'Order retrieved successfully'
    })

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve order',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}