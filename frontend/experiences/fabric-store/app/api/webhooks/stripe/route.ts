import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { Medusa } from '@medusajs/js-sdk'

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: '2023-10-16',
})

const medusa = new Medusa({
  baseUrl: process.env.MEDUSA_BACKEND_URL!,
  apiKey: process.env.MEDUSA_API_KEY!,
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')!
  const body = await request.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)
  const orders = await medusa.orders.list({ q: paymentIntent.id, limit: 1 } as any)
  if (orders.orders?.length > 0) {
    const order = orders.orders[0]
    await medusa.orders.capturePayment(order.id, {
      amount: paymentIntent.amount,
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        captured_at: new Date().toISOString(),
      },
    } as any)
    await triggerFulfillment(order)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id)
  const orders = await medusa.orders.list({ q: paymentIntent.id, limit: 1 } as any)
  if (orders.orders?.length > 0) {
    const order = orders.orders[0]
    await medusa.orders.cancel(order.id, {
      reason: 'payment_failed',
      metadata: {
        stripe_payment_intent_id: paymentIntent.id,
        failure_message: (paymentIntent.last_payment_error as any)?.message,
      },
    } as any)
    await sendPaymentFailureNotification(order, paymentIntent)
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Refund processed:', charge.id)
  const paymentIntentId = charge.payment_intent as string
  const orders = await medusa.orders.list({ q: paymentIntentId, limit: 1 } as any)
  if (orders.orders?.length > 0) {
    const order = orders.orders[0]
    await medusa.refunds.create({
      order_id: order.id,
      amount: charge.amount_refunded,
      reason: 'requested_by_customer',
      metadata: {
        stripe_charge_id: charge.id,
        stripe_refund_id: (charge.refunds?.data[0] as any)?.id,
      },
    } as any)
  }
}

async function handleCheckoutSessionCompleted(_session: Stripe.Checkout.Session) {
  // Usually handled by payment_intent.succeeded
}

async function triggerFulfillment(order: any) {
  await medusa.fulfillments.create({
    order_id: order.id,
    items: order.items.map((item: any) => ({ item_id: item.id, quantity: item.quantity })),
    metadata: { auto_fulfilled: true, fulfilled_at: new Date().toISOString() },
  } as any)
}

async function sendPaymentFailureNotification(_order: any, _intent: Stripe.PaymentIntent) {
  // Integrate with your notification system if available
}

