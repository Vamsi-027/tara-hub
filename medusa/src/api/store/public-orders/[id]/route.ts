/**
 * API endpoint to fetch a single order by ID
 * GET /store/public-orders/:id
 *
 * This endpoint uses Medusa's order service to fetch a specific order
 * Security Note: In production, this should verify that the requester
 * has the right to view this order (e.g., matching email or auth token)
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OrderService from "../../../../services/order.service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const orderId = req.params.id
  // Optional: verify ownership with email
  const email = req.query.email as string

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: "Order ID is required"
    })
  }

  try {
    // Get the order service from the container
    const orderService = req.scope.resolve("orderService") as OrderService

    if (!orderService) {
      // Fallback: try to get the order module directly
      const orderModule = req.scope.resolve("orderModuleService")

      if (orderModule && orderModule.retrieveOrder) {
        try {
          const order = await orderModule.retrieveOrder(orderId, {
            relations: [
              "items",
              "items.variant",
              "items.variant.product",
              "shipping_address",
              "billing_address"
            ]
          })

          // If email is provided, verify it matches the order
          if (email && order.email !== email.toLowerCase()) {
            return res.status(403).json({
              success: false,
              error: "Access denied",
              message: "You don't have permission to view this order"
            })
          }

          return res.json({
            success: true,
            order
          })
        } catch (err) {
          if (err.message?.includes("not found")) {
            return res.status(404).json({
              success: false,
              error: "Order not found"
            })
          }
          throw err
        }
      }

      return res.status(503).json({
        success: false,
        error: "Order service not available",
        message: "Unable to retrieve order at this time"
      })
    }

    // Use the custom order service
    let order

    try {
      if (email) {
        // If email is provided, use the secure method that verifies email
        order = await orderService.retrieveByIdAndEmail(orderId, email.toLowerCase())
      } else {
        // Otherwise just retrieve the order
        // WARNING: This allows anyone with order ID to view the order
        order = await orderService.retrieve(orderId, {
          relations: [
            "items",
            "items.variant",
            "shipping_address",
            "billing_address"
          ]
        })
      }
    } catch (err) {
      if (err.message?.includes("not found")) {
        return res.status(404).json({
          success: false,
          error: "Order not found"
        })
      }
      if (err.message?.includes("email does not match")) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
          message: "You don't have permission to view this order"
        })
      }
      throw err
    }

    return res.json({
      success: true,
      order
    })

  } catch (error) {
    console.error('Error fetching order:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}