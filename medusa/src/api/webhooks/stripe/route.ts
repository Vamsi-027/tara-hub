/**
 * Stripe Webhook Handler
 *
 * POST /webhooks/stripe - Handle Stripe webhook events
 *
 * Processes payment events and updates order status accordingly.
 * Ensures idempotency and signature verification.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import PaymentService from "../../../services/payment.service"
import OrderService from "../../../services/order.service"
import Stripe from "stripe"

// Store processed event IDs to prevent duplicate processing
const processedEvents = new Set<string>()

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_API_KEY || "", {
  apiVersion: "2023-10-16",
})

/**
 * Handle Stripe webhook events
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Check new checkout flag
    if (process.env.USE_NEW_CHECKOUT !== "true") {
      return res.status(501).json({
        error: "New checkout system is not enabled",
      })
    }

    // Get webhook signature
    const signature = req.headers["stripe-signature"] as string

    if (!signature) {
      console.error("Missing Stripe signature")
      return res.status(401).json({
        error: "Missing webhook signature",
      })
    }

    // Get webhook secret
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
      // Get raw body (assuming it's available as req.rawBody or req.body)
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

    // Check for duplicate events (idempotency)
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

    // Initialize services
    const paymentService = new PaymentService(req.scope)
    const orderService = new OrderService(req.scope)

    // Log webhook event
    console.log(`Processing Stripe webhook: ${event.type} (${event.id})`)

    // Handle specific event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(
          paymentIntent,
          paymentService,
          orderService
        )
        break
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(
          paymentIntent,
          paymentService,
          orderService
        )
        break
      }

      case "payment_intent.canceled": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentCanceled(
          paymentIntent,
          paymentService,
          orderService
        )
        break
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(
          session,
          paymentService,
          orderService
        )
        break
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge, orderService)
        break
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as Stripe.Dispute
        await handleDisputeCreated(dispute, orderService)
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }

    // Return success response
    return res.status(200).json({ received: true })
  } catch (error: any) {
    console.error("Webhook processing failed:", error)

    // Don't return 5xx errors to Stripe or they will retry
    // Log the error and return 200
    return res.status(200).json({
      received: true,
      error: error.message,
    })
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  paymentService: PaymentService,
  orderService: OrderService
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
    // Update payment service records
    await paymentService.handleWebhookEvent({
      id: paymentIntent.id,
      type: "payment_intent.succeeded",
      data: { object: paymentIntent },
    } as Stripe.Event)

    // If order already exists, update payment status
    if (orderId) {
      await orderService.updatePaymentStatus(orderId, "authorized")
      console.log(`Updated order ${orderId} payment status to authorized`)
    } else if (cartId) {
      // Create order if it doesn't exist
      // This handles cases where frontend didn't call complete endpoint
      console.log(`Creating order for cart ${cartId} from webhook`)

      try {
        const order = await orderService.createFromCart({
          cart_id: cartId,
          payment_intent_id: paymentIntent.id,
          idempotency_key: `webhook_${paymentIntent.id}`,
        })

        console.log(`Created order ${order.id} from webhook`)

        // Update payment intent metadata with order ID
        await stripe.paymentIntents.update(paymentIntent.id, {
          metadata: {
            ...paymentIntent.metadata,
            order_id: order.id,
          },
        })
      } catch (error: any) {
        if (error.message.includes("already completed")) {
          console.log(`Cart ${cartId} already completed`)
        } else {
          throw error
        }
      }
    }

    // If payment requires capture (manual capture mode)
    if (paymentIntent.status === "requires_capture") {
      console.log(`Payment intent ${paymentIntent.id} requires manual capture`)
    }
  } catch (error: any) {
    console.error(
      `Failed to handle payment_intent.succeeded for ${paymentIntent.id}:`,
      error
    )
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  paymentService: PaymentService,
  orderService: OrderService
): Promise<void> {
  const cartId = paymentIntent.metadata?.cart_id
  const orderId = paymentIntent.metadata?.order_id

  try {
    // Update payment service records
    await paymentService.handleWebhookEvent({
      id: paymentIntent.id,
      type: "payment_intent.payment_failed",
      data: { object: paymentIntent },
    } as Stripe.Event)

    // If order exists, update status
    if (orderId) {
      await orderService.updateStatus(orderId, "requires_action")
      await orderService.updatePaymentStatus(orderId, "awaiting")
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
  paymentService: PaymentService,
  orderService: OrderService
): Promise<void> {
  const orderId = paymentIntent.metadata?.order_id

  try {
    // Update payment service records
    await paymentService.handleWebhookEvent({
      id: paymentIntent.id,
      type: "payment_intent.canceled",
      data: { object: paymentIntent },
    } as Stripe.Event)

    // If order exists, cancel it
    if (orderId) {
      await orderService.cancel(orderId, "Payment canceled")
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
 * Handle completed checkout session
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  paymentService: PaymentService,
  orderService: OrderService
): Promise<void> {
  const cartId = session.metadata?.cart_id
  const paymentIntentId = session.payment_intent as string

  if (!cartId) {
    console.error(
      `Checkout session ${session.id} missing cart_id in metadata`
    )
    return
  }

  try {
    console.log(
      `Checkout session completed for cart ${cartId}, payment intent ${paymentIntentId}`
    )

    // The payment_intent.succeeded event will handle order creation
    // This event is just for tracking
  } catch (error: any) {
    console.error(
      `Failed to handle checkout.session.completed for ${session.id}:`,
      error
    )
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(
  charge: Stripe.Charge,
  orderService: OrderService
): Promise<void> {
  const orderId = charge.metadata?.order_id

  if (!orderId) {
    console.error(`Charge ${charge.id} missing order_id in metadata`)
    return
  }

  try {
    const refundAmount = charge.amount_refunded

    if (refundAmount === charge.amount) {
      // Full refund
      await orderService.updatePaymentStatus(orderId, "refunded")
      console.log(`Order ${orderId} fully refunded`)
    } else if (refundAmount > 0) {
      // Partial refund
      await orderService.updatePaymentStatus(orderId, "partially_refunded")
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
  orderService: OrderService
): Promise<void> {
  const chargeId = dispute.charge as string

  try {
    // Retrieve charge to get order ID
    const charge = await stripe.charges.retrieve(chargeId)
    const orderId = charge.metadata?.order_id

    if (orderId) {
      // Update order metadata to track dispute
      const order = await orderService.retrieve(orderId)
      await orderService.update(orderId, {
        metadata: {
          ...order.metadata,
          dispute_id: dispute.id,
          dispute_status: dispute.status,
          dispute_reason: dispute.reason,
        },
      })

      console.log(`Dispute created for order ${orderId}: ${dispute.reason}`)
    }
  } catch (error: any) {
    console.error(
      `Failed to handle charge.dispute.created for ${dispute.id}:`,
      error
    )
  }
}