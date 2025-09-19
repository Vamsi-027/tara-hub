/**
 * Payment Service
 *
 * Manages payment sessions with Stripe, handles payment intents,
 * and coordinates with webhooks for payment confirmation.
 */

import { MedusaService } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"
import { IPaymentModuleService } from "@medusajs/framework/types"
import Stripe from "stripe"

export interface CreatePaymentSessionInput {
  cart_id: string
  provider_id: string
  customer_id?: string
}

export interface PaymentSessionData {
  id: string
  provider_id: string
  cart_id: string
  status: "pending" | "authorized" | "captured" | "canceled" | "failed"
  data: {
    client_secret: string
    payment_intent_id: string
    publishable_key?: string
  }
  amount: number
  currency_code: string
  created_at: Date
  updated_at: Date
}

export interface ConfirmPaymentInput {
  payment_intent_id: string
  cart_id: string
}

class PaymentService extends MedusaService({
  Payment: {
    moduleKey: Modules.PAYMENT,
  },
}) {
  protected paymentModule_: IPaymentModuleService
  private stripe: Stripe

  constructor(container: any) {
    super(container)
    this.paymentModule_ = container[Modules.PAYMENT]

    // Initialize Stripe
    if (!process.env.STRIPE_API_KEY) {
      throw new Error("STRIPE_API_KEY is required")
    }

    this.stripe = new Stripe(process.env.STRIPE_API_KEY, {
      apiVersion: "2023-10-16",
    })
  }

  /**
   * Create a payment session for a cart
   */
  async createPaymentSession(
    input: CreatePaymentSessionInput
  ): Promise<PaymentSessionData> {
    const { cart_id, provider_id, customer_id } = input

    if (provider_id !== "stripe") {
      throw new Error(`Payment provider ${provider_id} not supported`)
    }

    // Get cart data (would normally call CartService)
    const cart = await this.getCart(cart_id)

    if (!cart) {
      throw new Error(`Cart ${cart_id} not found`)
    }

    if (cart.completed_at) {
      throw new Error("Cannot create payment for completed cart")
    }

    // Validate cart has required data
    if (!cart.email && !customer_id) {
      throw new Error("Email or customer ID required for payment")
    }

    if (cart.total <= 0) {
      throw new Error("Cart total must be greater than 0")
    }

    try {
      // Create or retrieve Stripe customer
      let stripeCustomer: Stripe.Customer | undefined

      if (customer_id) {
        // Look up existing Stripe customer
        const customers = await this.stripe.customers.list({
          email: cart.email,
          limit: 1,
        })

        if (customers.data.length > 0) {
          stripeCustomer = customers.data[0]
        }
      }

      if (!stripeCustomer && cart.email) {
        // Create new Stripe customer
        stripeCustomer = await this.stripe.customers.create({
          email: cart.email,
          metadata: {
            medusa_customer_id: customer_id || "",
            cart_id,
            source: "fabric-store",
          },
        })
      }

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(cart.total), // Amount in cents
        currency: cart.currency_code.toLowerCase(),
        customer: stripeCustomer?.id,
        description: `Order from Fabric Store`,
        metadata: {
          cart_id,
          customer_id: customer_id || "",
          email: cart.email || "",
          region_id: cart.region_id,
          source: "fabric-store",
        },
        automatic_payment_methods: {
          enabled: true,
        },
        capture_method: "manual", // Allow admin to capture later
      })

      // Store payment session in database
      const paymentSession = await this.paymentModule_.createPaymentSession({
        provider_id: "stripe",
        cart_id,
        amount: cart.total,
        currency_code: cart.currency_code,
        data: {
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          customer_id: stripeCustomer?.id,
        },
        status: "pending",
        metadata: {
          stripe_customer_id: stripeCustomer?.id,
        },
      })

      return {
        id: paymentSession.id,
        provider_id: "stripe",
        cart_id,
        status: "pending",
        data: {
          client_secret: paymentIntent.client_secret!,
          payment_intent_id: paymentIntent.id,
          publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        },
        amount: cart.total,
        currency_code: cart.currency_code,
        created_at: new Date(),
        updated_at: new Date(),
      }
    } catch (error: any) {
      console.error("Stripe payment intent creation failed:", error)
      throw new Error(`Failed to create payment session: ${error.message}`)
    }
  }

  /**
   * Update payment session with saved payment method
   */
  async updatePaymentSession(
    sessionId: string,
    paymentMethodId: string
  ): Promise<PaymentSessionData> {
    const session = await this.paymentModule_.retrievePaymentSession(sessionId)

    if (!session) {
      throw new Error(`Payment session ${sessionId} not found`)
    }

    if (session.status !== "pending") {
      throw new Error("Can only update pending payment sessions")
    }

    try {
      // Update payment intent with payment method
      await this.stripe.paymentIntents.update(
        session.data.payment_intent_id,
        {
          payment_method: paymentMethodId,
        }
      )

      // Update session data
      const updated = await this.paymentModule_.updatePaymentSession(sessionId, {
        data: {
          ...session.data,
          payment_method_id: paymentMethodId,
        },
      })

      return {
        id: updated.id,
        provider_id: updated.provider_id,
        cart_id: updated.cart_id,
        status: updated.status,
        data: updated.data,
        amount: updated.amount,
        currency_code: updated.currency_code,
        created_at: updated.created_at,
        updated_at: new Date(),
      }
    } catch (error: any) {
      console.error("Failed to update payment session:", error)
      throw new Error(`Failed to update payment session: ${error.message}`)
    }
  }

  /**
   * Verify payment with Stripe and update status
   */
  async verifyPayment(input: ConfirmPaymentInput): Promise<{
    verified: boolean
    status: string
    payment_intent?: Stripe.PaymentIntent
  }> {
    const { payment_intent_id, cart_id } = input

    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        payment_intent_id,
        {
          expand: ["payment_method", "customer"],
        }
      )

      // Verify cart_id matches metadata
      if (paymentIntent.metadata.cart_id !== cart_id) {
        throw new Error("Payment intent does not match cart")
      }

      // Check payment status
      const verified =
        paymentIntent.status === "succeeded" ||
        paymentIntent.status === "requires_capture"

      return {
        verified,
        status: paymentIntent.status,
        payment_intent: paymentIntent,
      }
    } catch (error: any) {
      console.error("Payment verification failed:", error)
      return {
        verified: false,
        status: "failed",
      }
    }
  }

  /**
   * Capture authorized payment
   */
  async capturePayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const captured = await this.stripe.paymentIntents.capture(paymentIntentId)

      // Update payment session status
      await this.updatePaymentSessionStatus(paymentIntentId, "captured")

      return captured
    } catch (error: any) {
      console.error("Payment capture failed:", error)
      throw new Error(`Failed to capture payment: ${error.message}`)
    }
  }

  /**
   * Cancel payment
   */
  async cancelPayment(paymentIntentId: string): Promise<void> {
    try {
      await this.stripe.paymentIntents.cancel(paymentIntentId)

      // Update payment session status
      await this.updatePaymentSessionStatus(paymentIntentId, "canceled")
    } catch (error: any) {
      console.error("Payment cancellation failed:", error)
      throw new Error(`Failed to cancel payment: ${error.message}`)
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount, // If not provided, refunds full amount
        reason: reason as Stripe.RefundCreateParams.Reason || "requested_by_customer",
        metadata: {
          source: "medusa_admin",
        },
      })

      return refund
    } catch (error: any) {
      console.error("Payment refund failed:", error)
      throw new Error(`Failed to refund payment: ${error.message}`)
    }
  }

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      // Get Stripe customer ID
      const customers = await this.stripe.customers.list({
        limit: 1,
        query: `metadata['medusa_customer_id']:'${customerId}'`,
      })

      if (customers.data.length === 0) {
        return []
      }

      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customers.data[0].id,
        type: "card",
      })

      return paymentMethods.data
    } catch (error: any) {
      console.error("Failed to list payment methods:", error)
      return []
    }
  }

  /**
   * Handle webhook event from Stripe
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log(`Processing Stripe webhook: ${event.type}`)

    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        )
        break

      case "payment_intent.payment_failed":
        await this.handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        )
        break

      case "payment_intent.canceled":
        await this.handlePaymentIntentCanceled(
          event.data.object as Stripe.PaymentIntent
        )
        break

      case "charge.refunded":
        await this.handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const cartId = paymentIntent.metadata.cart_id

    if (!cartId) {
      console.error("No cart_id in payment intent metadata")
      return
    }

    await this.updatePaymentSessionStatus(paymentIntent.id, "authorized")

    // Trigger order creation workflow
    console.log(`Payment succeeded for cart ${cartId}`)
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const cartId = paymentIntent.metadata.cart_id

    if (!cartId) {
      console.error("No cart_id in payment intent metadata")
      return
    }

    await this.updatePaymentSessionStatus(paymentIntent.id, "failed")

    console.log(`Payment failed for cart ${cartId}`)
  }

  /**
   * Handle canceled payment intent
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const cartId = paymentIntent.metadata.cart_id

    if (!cartId) {
      console.error("No cart_id in payment intent metadata")
      return
    }

    await this.updatePaymentSessionStatus(paymentIntent.id, "canceled")

    console.log(`Payment canceled for cart ${cartId}`)
  }

  /**
   * Handle charge refunded
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    console.log(`Charge refunded: ${charge.id}`)
    // Update order status if needed
  }

  /**
   * Update payment session status in database
   */
  private async updatePaymentSessionStatus(
    paymentIntentId: string,
    status: "pending" | "authorized" | "captured" | "canceled" | "failed"
  ): Promise<void> {
    try {
      // Find session by payment intent ID
      const sessions = await this.paymentModule_.listPaymentSessions({
        filters: {
          data: {
            payment_intent_id: paymentIntentId,
          },
        },
      })

      if (sessions.length > 0) {
        await this.paymentModule_.updatePaymentSession(sessions[0].id, {
          status,
        })
      }
    } catch (error: any) {
      console.error("Failed to update payment session status:", error)
    }
  }

  /**
   * Get cart (placeholder - would use CartService)
   */
  private async getCart(cartId: string): Promise<any> {
    // This would normally call CartService.retrieve(cartId)
    // For now, return mock data
    return {
      id: cartId,
      email: "customer@example.com",
      currency_code: "usd",
      region_id: "reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ",
      total: 10000, // $100.00 in cents
      completed_at: null,
    }
  }
}

export default PaymentService