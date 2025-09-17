/**
 * Stripe Webhook Handler
 * Updates Medusa order status based on Stripe payment events
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { orderService } from '@/lib/services/order.service'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil',
})

// Webhook secret from Stripe dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('📮 Stripe webhook received:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('💳 Payment succeeded:', paymentIntent.id)

        // Get order ID from metadata
        const orderId = paymentIntent.metadata?.order_id
        if (orderId) {
          try {
            // Update order status in Medusa
            await orderService.updateOrderStatus(orderId, 'paid')
            console.log('✅ Order status updated to paid:', orderId)
          } catch (error) {
            console.error('Failed to update order status:', error)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('❌ Payment failed:', paymentIntent.id)

        const orderId = paymentIntent.metadata?.order_id
        if (orderId) {
          try {
            await orderService.updateOrderStatus(orderId, 'failed')
            console.log('Order status updated to failed:', orderId)
          } catch (error) {
            console.error('Failed to update order status:', error)
          }
        }
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        console.log('💰 Charge succeeded:', charge.id)

        // Update order with receipt URL if available
        const orderId = charge.metadata?.order_id
        if (orderId && charge.receipt_url) {
          try {
            // You can store the receipt URL or send it via email
            console.log('Receipt URL:', charge.receipt_url)
          } catch (error) {
            console.error('Failed to update order with receipt:', error)
          }
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('🛒 Checkout session completed:', session.id)

        // Handle checkout session completion if using Stripe Checkout
        const orderId = session.metadata?.order_id
        if (orderId) {
          try {
            await orderService.updateOrderStatus(orderId, 'paid')
            console.log('✅ Order marked as paid from checkout session:', orderId)
          } catch (error) {
            console.error('Failed to update order from checkout session:', error)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Stripe webhooks require raw body, so we need to disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
}