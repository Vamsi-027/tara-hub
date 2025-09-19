/**
 * Cart Management API Routes
 *
 * GET /store/carts/:id - Get cart by ID
 * PATCH /store/carts/:id - Update cart
 * DELETE /store/carts/:id - Delete cart
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import CartService from "../../../../services/cart.service"
import { z } from "zod"

// Request validation schemas
const updateCartSchema = z.object({
  email: z.string().email().optional(),
  billing_address: z.object({
    first_name: z.string(),
    last_name: z.string(),
    address_1: z.string(),
    address_2: z.string().optional(),
    city: z.string(),
    province: z.string(),
    postal_code: z.string(),
    country_code: z.string(),
    phone: z.string().optional(),
  }).optional(),
  shipping_address: z.object({
    first_name: z.string(),
    last_name: z.string(),
    address_1: z.string(),
    address_2: z.string().optional(),
    city: z.string(),
    province: z.string(),
    postal_code: z.string(),
    country_code: z.string(),
    phone: z.string().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * Get cart by ID
 */
export async function GET(
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

    // Initialize cart service
    const cartService = new CartService(req.scope)

    // Retrieve cart
    const cart = await cartService.retrieve(cartId)

    return res.status(200).json({
      cart,
    })
  } catch (error: any) {
    console.error(`Failed to retrieve cart ${req.params.id}:`, error)

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: {
          code: "CART_NOT_FOUND",
          message: error.message,
        },
      })
    }

    if (error.message.includes("expired")) {
      return res.status(410).json({
        error: {
          code: "CART_EXPIRED",
          message: error.message,
        },
      })
    }

    return res.status(500).json({
      error: {
        code: "CART_RETRIEVAL_FAILED",
        message: error.message || "Failed to retrieve cart",
      },
    })
  }
}

/**
 * Update cart
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
    const validation = updateCartSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "Invalid request data",
          details: validation.error.errors,
        },
      })
    }

    const data = validation.data

    // Initialize cart service
    const cartService = new CartService(req.scope)

    // Update cart
    const cart = await cartService.update(cartId, data)

    return res.status(200).json({
      cart,
    })
  } catch (error: any) {
    console.error(`Failed to update cart ${req.params.id}:`, error)

    if (error.message.includes("not found")) {
      return res.status(404).json({
        error: {
          code: "CART_NOT_FOUND",
          message: error.message,
        },
      })
    }

    if (error.message.includes("completed")) {
      return res.status(409).json({
        error: {
          code: "CART_ALREADY_COMPLETED",
          message: error.message,
        },
      })
    }

    return res.status(500).json({
      error: {
        code: "CART_UPDATE_FAILED",
        message: error.message || "Failed to update cart",
      },
    })
  }
}

/**
 * Delete cart
 */
export async function DELETE(
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

    // Initialize cart service
    const cartService = new CartService(req.scope)

    // Delete cart
    await cartService.delete(cartId)

    return res.status(204).send()
  } catch (error: any) {
    console.error(`Failed to delete cart ${req.params.id}:`, error)

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
        code: "CART_DELETION_FAILED",
        message: error.message || "Failed to delete cart",
      },
    })
  }
}