/**
 * Cart Management API Routes
 *
 * POST /store/carts - Create cart
 * GET /store/carts/:id - Get cart
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import CartService from "../../../services/cart.service"
import { z } from "zod"

// Request validation schemas
const createCartSchema = z.object({
  region_id: z.string(),
  email: z.string().email().optional(),
  currency_code: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

/**
 * Create a new cart
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
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

    // Validate request body
    const validation = createCartSchema.safeParse(req.body)
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

    // Get idempotency key
    const idempotencyKey = req.headers["x-idempotency-key"] as string

    // Check if cart already exists for this idempotency key
    if (idempotencyKey) {
      // Would check cache/database for existing cart
      console.log(`Idempotency key: ${idempotencyKey}`)
    }

    // Initialize cart service
    const cartService = new CartService(req.scope)

    // Create cart
    const cart = await cartService.create({
      region_id: data.region_id,
      email: data.email,
      currency_code: data.currency_code,
      metadata: {
        ...data.metadata,
        source: "fabric-store",
        session_id: req.headers["x-session-id"] as string,
      },
    })

    // Log for debugging
    console.log(`Created cart ${cart.id} for ${cart.email || "guest"}`)

    return res.status(200).json({
      cart,
    })
  } catch (error: any) {
    console.error("Cart creation failed:", error)

    if (error.message.includes("Region") && error.message.includes("not found")) {
      return res.status(404).json({
        error: {
          code: "REGION_NOT_FOUND",
          message: error.message,
        },
      })
    }

    return res.status(500).json({
      error: {
        code: "CART_CREATION_FAILED",
        message: error.message || "Failed to create cart",
      },
    })
  }
}