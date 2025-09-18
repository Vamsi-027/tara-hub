/**
 * Create Medusa Order API Route
 * Creates an order in Medusa backend that will appear in the admin panel
 */

import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/lib/services/order.service'
import Stripe from 'stripe'

// Initialize Stripe
let stripe: Stripe | null = null
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, items, shipping, total } = body

    console.log('📦 Creating Medusa order...')
    console.log('Customer:', email)
    console.log('Items:', items.length)
    console.log('Total:', total)

    // Transform cart items to match order service format
    const orderItems = items.map((item: any) => {
      // Use variantId if available, otherwise fall back to id
      const itemId = item.variantId || item.id

      console.log('📦 Processing cart item:', {
        originalId: item.id,
        variantId: item.variantId,
        usedId: itemId,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        yardage: item.yardage,
        type: item.type
      })

      return {
        id: itemId,
        name: item.title || item.variant || 'Product',
        sku: item.sku || `SKU-${item.type || 'fabric'}-${item.productId || item.id}-${itemId}`,
        color: item.color || '',
        price: item.price, // Already in cents
        quantity: item.type === 'fabric' && item.yardage ? item.yardage : item.quantity,
        image: item.thumbnail || '',
      }
    })

    // Create order using the order service (fallback will handle Medusa creation)
    const medusaOrder = await orderService.createOrder({
      email,
      items: orderItems,
      shipping: {
        firstName: shipping.firstName,
        lastName: shipping.lastName || '',
        email: email,
        phone: shipping.phone || '',
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        zipCode: shipping.zipCode,
        country: shipping.country || 'US',
      },
      total,
    })

    console.log('✅ Medusa order created:', medusaOrder.id)

    // Create payment intent if Stripe is configured
    let paymentIntent = null
    let clientSecret = null

    if (stripe && total > 0) {
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount: total, // Amount in cents
          currency: 'usd',
          metadata: {
            order_id: medusaOrder.id,
            email,
            item_count: items.length.toString(),
            medusa_order: 'true',
          },
          receipt_email: email,
          description: `Order ${medusaOrder.id}`,
        })

        clientSecret = paymentIntent.client_secret

        console.log('💳 Payment intent created:', paymentIntent.id)

        // Update order with payment intent ID
        try {
          await orderService.updateOrderStatus(medusaOrder.id, 'paid' as any)
        } catch (updateError) {
          console.error('Failed to update order with payment intent:', updateError)
        }
      } catch (stripeError) {
        console.error('Stripe payment intent creation failed:', stripeError)
        // Continue without payment - order is still created in Medusa
      }
    }

    return NextResponse.json({
      success: true,
      order: medusaOrder,
      orderId: medusaOrder.id,
      clientSecret,
      paymentIntentId: paymentIntent?.id,
      message: 'Order created successfully in Medusa',
    })

  } catch (error) {
    console.error('❌ Error creating Medusa order:', error)

    return NextResponse.json(
      {
        error: 'Failed to create order',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}