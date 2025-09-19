/**
 * Payment Session API Routes
 *
 * POST /store/carts/:id/payment-sessions - Create payment session
 * PATCH /store/carts/:id/payment-sessions - Update payment session
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import CartService from "../../../../../services/cart.service"
import PaymentService from "../../../../../services/payment.service"
import { z } from "zod"

// Request validation schemas
const createPaymentSessionSchema = z.object({
  provider_id: z.enum(["stripe"]),
})

const updatePaymentSessionSchema = z.object({
  provider_id: z.enum(["stripe"]),
  payment_method_id: z.string().optional(),
})

/**
 * Create payment session for cart
 */
export async function POST(
  req: MedusaRequest & { params: { id: string } },
  res: MedusaResponse
) {
  try {
    // Check new checkout flag
    if (process.env.USE_NEW_CHECKOUT !== "true") {
      return res.status(501).json({
        error: {
          code: "NEW_CHECKOUT_DISABLED",
          message: "New checkout system is not enabled",
        },
      })
    }

    const cartId = req.params.id

    // Validate request body
    const validation = createPaymentSessionSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid request data",
          details: validation.error.errors,
        },
      })
    }

    const { provider_id } = validation.data

    // Get idempotency key
    const idempotencyKey = req.headers["x-idempotency-key"] as string

    // Initialize services
    const cartService = new CartService(req.scope)
    const paymentService = new PaymentService(req.scope)

    // Validate cart
    const cart = await cartService.retrieve(cartId)

    if (cart.completed_at) {
      return res.status(409).json({
        error: {
          code: "CART_ALREADY_COMPLETED",
          message: "Cannot create payment for completed cart",
        },
      })
    }

    // Validate cart for checkout
    const validation_result = await cartService.validateForCheckout(cartId)
    if (!validation_result.valid) {
      return res.status(400).json({
        error: {
          code: "CART_VALIDATION_FAILED",
          message: "Cart is not ready for payment",
          details: validation_result.errors,
        },
      })
    }

    // Create payment session
    const paymentSession = await paymentService.createPaymentSession({
      cart_id: cartId,
      provider_id,
      customer_id: cart.customer_id,
    })

    // Log for debugging
    console.log(`Created payment session for cart ${cartId}`)

    return res.status(200).json({
      payment_session: paymentSession,
    })
  } catch (error: any) {
    console.error(`Failed to create payment session for cart ${req.params.id}:`, error)

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: {
          code: "CART_NOT_FOUND",
          message: error.message,
        },
      })
    }

    return res.status(500).json({
      error: {
        code: "PAYMENT_SESSION_CREATION_FAILED",
        message: error.message || "Failed to create payment session",
      },
    })
  }
}

/**
 * Update payment session
 */
export async function PATCH(
  req: MedusaRequest & { params: { id: string } },
  res: MedusaResponse
) {
  try {
    // Check new checkout flag
    if (process.env.USE_NEW_CHECKOUT !== "true") {
      return res.status(501).json({
        error: {
          code: "NEW_CHECKOUT_DISABLED",
          message: "New checkout system is not enabled",
        },
      })
    }

    const cartId = req.params.id

    // Validate request body
    const validation = updatePaymentSessionSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid request data",
          details: validation.error.errors,
        },
      })
    }

    const { provider_id, payment_method_id } = validation.data

    if (!payment_method_id) {
      return res.status(400).json({
        error: {
          code: "PAYMENT_METHOD_REQUIRED",
          message: "Payment method ID is required for update",
        },
      })
    }

    // Initialize services
    const cartService = new CartService(req.scope)
    const paymentService = new PaymentService(req.scope)

    // Validate cart
    const cart = await cartService.retrieve(cartId)

    if (cart.completed_at) {
      return res.status(409).json({
        error: {
          code: "CART_ALREADY_COMPLETED",
          message: "Cannot update payment for completed cart",
        },
      })
    }

    // Get existing payment session
    // This is simplified - would need to retrieve from database
    const sessionId = "ps_" + cartId // Placeholder

    // Update payment session
    const updatedSession = await paymentService.updatePaymentSession(
      sessionId,
      payment_method_id
    )

    return res.status(200).json({
      payment_session: updatedSession,
    })
  } catch (error: any) {
    console.error(`Failed to update payment session for cart ${req.params.id}:`, error)

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: {
          code: "PAYMENT_SESSION_NOT_FOUND",
          message: error.message,
        },
      })
    }

    return res.status(500).json({
      error: {
        code: "PAYMENT_SESSION_UPDATE_FAILED",
        message: error.message || "Failed to update payment session",
      },
    })
  }
}