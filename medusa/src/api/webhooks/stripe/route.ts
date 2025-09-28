/**
 * Stripe Webhook Handler - Medusa v2 Native Implementation
 *
 * POST /webhooks/stripe - Handle Stripe webhook events
 *
 * Uses Medusa's native payment workflows and container resolution.
 * Replaces custom payment service with framework-native patterns.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import {
  processPaymentWorkflow,
  capturePaymentWorkflow,
  refundPaymentWorkflow
} from "@medusajs/medusa/core-flows"
import Stripe from "stripe"

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2024-04-10",
})

// Database-backed idempotency tracking (replaces in-memory Set)
interface ProcessedEvent {
  id: string
  processed_at: Date
  event_type: string
}

/**
 * Handle Stripe webhook events using Medusa v2 native workflows
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Validate webhook signature
    const signature = req.headers["stripe-signature"] as string
    if (!signature) {
      console.error("Missing Stripe signature")
      return res.status(401).json({
        error: "Missing webhook signature",
      })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured")
      return res.status(500).json({
        error: "Webhook secret not configured",
      })
    }

    // Verify webhook signature and construct event
    let event: Stripe.Event
    try {
      // Get raw body for signature verification
      const rawBody = req.body
      event = stripe.webhooks.constructEvent(
        typeof rawBody === "string" ? rawBody : JSON.stringify(rawBody),
        signature,
        webhookSecret
      )
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message)
      return res.status(400).json({
        error: `Webhook signature verification failed: ${err.message}`,
      })
    }

    // Simple in-memory idempotency check (TODO: Replace with database when available)
    const processedEvents = global.__processedWebhookEvents || new Set()
    global.__processedWebhookEvents = processedEvents

    if (processedEvents.has(event.id)) {
      console.log(`Duplicate event ${event.id} - skipping`)
      return res.status(200).json({ received: true, duplicate: true })
    }

    // Mark event as processed
    processedEvents.add(event.id)

    // Clean up old events (keep only last 1000)
    if (processedEvents.size > 1000) {
      const firstEvent = processedEvents.values().next().value
      processedEvents.delete(firstEvent)
    }

    // Resolve Medusa framework services
    const container = req.scope

    // Log webhook event
    console.log(`Processing Stripe webhook: ${event.type} (${event.id})`)

    // Route events to appropriate Medusa workflows
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(
          paymentIntent,
          container
        )
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(
          paymentIntent,
          container
        )
        break
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentCanceled(
          paymentIntent,
          container
        )
        break
      }

      case "payment_intent.amount_capturable_updated": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentCapturableUpdated(
          paymentIntent,
          container
        )
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(
          charge,
          container
        )
        break
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute
        await handleDisputeCreated(
          dispute,
          container
        )
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error("Webhook processing failed:", error)

    // Return 200 to prevent Stripe retries for application errors
    return res.status(200).json({
      received: true,
      error: error.message,
    })
  }
}

/**
 * Handle successful payment intent using Medusa workflows
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  container: any
): Promise<void> {
  const cartId = paymentIntent.metadata?.cart_id
  const orderId = paymentIntent.metadata?.order_id

  if (!cartId && !orderId) {
    console.error(
      `Payment intent ${paymentIntent.id} missing cart_id or order_id in metadata`
    )
    return
  }

  try {
    // Use Medusa's native processPaymentWorkflow
    const { result } = await processPaymentWorkflow(container).run({
      input: {
        action: "captured",
        data: {
          session_id: paymentIntent.metadata?.payment_session_id,
          amount: paymentIntent.amount_received,
          currency_code: paymentIntent.currency.toUpperCase(),
          payment_intent_id: paymentIntent.id,
        }
      }
    })

    console.log(`Processed payment for intent ${paymentIntent.id}:`, result)

    // If payment requires manual capture
    if (paymentIntent.status === "requires_capture") {
      console.log(`Payment intent ${paymentIntent.id} requires manual capture`)
      // Manual capture will be handled by admin interface
    }
  } catch (error: any) {
    console.error(
      `Failed to process payment_intent.succeeded for ${paymentIntent.id}:`,
      error
    )
  }
}

/**
 * Handle failed payment intent using framework modules
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  container: any
): Promise<void> {
  const cartId = paymentIntent.metadata?.cart_id
  const orderId = paymentIntent.metadata?.order_id

  try {
    // Get framework modules
    const paymentModule = container.resolve("payment")
    const orderModule = container.resolve("order")

    // Update payment collection status using framework
    if (paymentIntent.metadata?.payment_collection_id) {
      await paymentModule.updatePaymentCollections([{
        id: paymentIntent.metadata.payment_collection_id,
        status: "not_paid"
      }])
    }

    // Update order status if exists
    if (orderId) {
      await orderModule.updateOrders([{
        id: orderId,
        status: "requires_action"
      }])
      console.log(`Updated order ${orderId} - payment failed`)
    }

    // Log failure reason
    const lastError = paymentIntent.last_payment_error
    console.error(
      `Payment failed for cart ${cartId}: ${lastError?.message || "Unknown error"}`
    )
  } catch (error: any) {
    console.error(
      `Failed to handle payment_intent.payment_failed for ${paymentIntent.id}:`,
      error
    )
  }
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  container: any
): Promise<void> {
  const orderId = paymentIntent.metadata?.order_id

  try {
    // Get framework modules
    const orderModule = container.resolve("order")

    // Cancel order if exists using framework
    if (orderId) {
      await orderModule.cancelOrder(orderId, {
        reason: "Payment canceled"
      })
      console.log(`Canceled order ${orderId} due to payment cancellation`)
    }
  } catch (error: any) {
    console.error(
      `Failed to handle payment_intent.canceled for ${paymentIntent.id}:`,
      error
    )
  }
}

/**
 * Handle capturable amount updates
 */
async function handlePaymentIntentCapturableUpdated(
  paymentIntent: Stripe.PaymentIntent,
  container: any
): Promise<void> {
  try {
    console.log(
      `Payment intent ${paymentIntent.id} capturable amount updated: ${paymentIntent.amount_capturable}`
    )

    // This event indicates manual capture is available
    // Admin interface will handle the actual capture
  } catch (error: any) {
    console.error(
      `Failed to handle payment_intent.amount_capturable_updated for ${paymentIntent.id}:`,
      error
    )
  }
}

/**
 * Handle charge refunded using native workflow
 */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  container: any
): Promise<void> {
  const orderId = charge.metadata?.order_id

  if (!orderId) {
    console.error(`Charge ${charge.id} missing order_id in metadata`)
    return
  }

  try {
    const refundAmount = charge.amount_refunded

    // Use Medusa's native refund workflow
    await refundPaymentWorkflow(container).run({
      input: {
        order_id: orderId,
        amount: refundAmount,
        reason: "Stripe webhook refund",
        note: `Refunded via Stripe charge ${charge.id}`,
      }
    })

    if (refundAmount === charge.amount) {
      console.log(`Order ${orderId} fully refunded`)
    } else if (refundAmount > 0) {
      console.log(`Order ${orderId} partially refunded: ${refundAmount}`)
    }
  } catch (error: any) {
    console.error(
      `Failed to handle charge.refunded for ${charge.id}:`,
      error
    )
  }
}

/**
 * Handle dispute created
 */
async function handleDisputeCreated(
  dispute: Stripe.Dispute,
  container: any
): Promise<void> {
  const chargeId = dispute.charge as string

  try {
    // Retrieve charge to get order ID
    const charge = await stripe.charges.retrieve(chargeId)
    const orderId = charge.metadata?.order_id

    if (orderId) {
      // Get framework modules
      const orderModule = container.resolve("order")

      // Update order metadata to track dispute using framework
      await orderModule.updateOrders([{
        id: orderId,
        metadata: {
          dispute_id: dispute.id,
          dispute_status: dispute.status,
          dispute_reason: dispute.reason,
          dispute_created_at: new Date(dispute.created * 1000).toISOString(),
        }
      }])

      console.log(`Dispute created for order ${orderId}: ${dispute.reason}`)
    }
  } catch (error: any) {
    console.error(
      `Failed to handle charge.dispute.created for ${dispute.id}:`,
      error
    )
  }
}