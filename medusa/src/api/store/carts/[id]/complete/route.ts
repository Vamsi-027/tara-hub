/**
 * Checkout Completion API Route
 *
 * POST /store/carts/:id/complete - Complete checkout and create order
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import CartService from "../../../../../services/cart.service"
import OrderService from "../../../../../services/order.service"
import { z } from "zod"

// Request validation schema
const completeCheckoutSchema = z.object({
  payment_intent_id: z.string(),
})

/**
 * Complete checkout and create order
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
    const validation = completeCheckoutSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid request data",
          details: validation.error.errors,
        },
      })
    }

    const { payment_intent_id } = validation.data

    // Get idempotency key for order creation
    const idempotencyKey = req.headers["x-idempotency-key"] as string

    // Initialize services
    const cartService = new CartService(req.scope)
    const orderService = new OrderService(req.scope)

    // Validate cart exists
    const cart = await cartService.retrieve(cartId)

    // Check if cart is already completed
    if (cart.completed_at) {
      // Try to find the order
      const existingOrder = await orderService.list({
        limit: 1,
      })

      const order = existingOrder.orders.find(o => o.cart_id === cartId)

      if (order) {
        return res.status(409).json({
          error: {
            code: "CART_ALREADY_COMPLETED",
            message: "This cart has already been completed",
            order_id: order.id,
          },
        })
      }

      return res.status(409).json({
        error: {
          code: "CART_ALREADY_COMPLETED",
          message: "This cart has already been completed",
        },
      })
    }

    // Validate cart for checkout
    const validation_result = await cartService.validateForCheckout(cartId)
    if (!validation_result.valid) {
      return res.status(400).json({
        error: {
          code: "CART_VALIDATION_FAILED",
          message: "Cart is not ready for checkout",
          details: validation_result.errors,
        },
      })
    }

    // Create order from cart
    const order = await orderService.createFromCart({
      cart_id: cartId,
      payment_intent_id,
      idempotency_key: idempotencyKey,
    })

    // Log successful checkout
    console.log(`Checkout completed for cart ${cartId}, created order ${order.id}`)

    return res.status(200).json({
      order,
    })
  } catch (error: any) {
    console.error(`Failed to complete checkout for cart ${req.params.id}:`, error)

    // Handle specific errors
    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: {
          code: "CART_NOT_FOUND",
          message: error.message,
        },
      })
    }

    if (error.message.includes("Payment not confirmed")) {
      return res.status(400).json({
        error: {
          code: "PAYMENT_NOT_CONFIRMED",
          message: error.message,
        },
      })
    }

    if (error.message.includes("validation failed")) {
      return res.status(400).json({
        error: {
          code: "CHECKOUT_VALIDATION_FAILED",
          message: error.message,
        },
      })
    }

    if (error.message.includes("inventory")) {
      return res.status(409).json({
        error: {
          code: "INSUFFICIENT_INVENTORY",
          message: error.message,
        },
      })
    }

    return res.status(500).json({
      error: {
        code: "CHECKOUT_COMPLETION_FAILED",
        message: error.message || "Failed to complete checkout",
      },
    })
  }
}