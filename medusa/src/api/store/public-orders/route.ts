/**
 * API endpoint to fetch orders by email
 * GET /store/public-orders?email=customer@example.com
 *
 * This endpoint uses Medusa's order service to fetch orders
 * Security Note: This should be enhanced with proper authentication
 * to prevent unauthorized access to customer data
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import OrderService from "../../../services/order.service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const email = req.query.email as string
  const limit = parseInt(req.query.limit as string) || 10
  const offset = parseInt(req.query.offset as string) || 0

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email parameter is required"
    })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format"
    })
  }

  try {
    // Get the order service from the container
    const orderService = req.scope.resolve("orderService") as OrderService

    if (!orderService || !orderService.list) {
      console.error('Order service not properly initialized')

      // Fallback: try to get the order module directly
      const orderModule = req.scope.resolve("orderModuleService")

      if (orderModule && orderModule.listOrders) {
        // Use the order module directly
        const [orders, count] = await orderModule.listAndCountOrders(
          {
            email: email.toLowerCase()
          },
          {
            skip: offset,
            take: limit,
            relations: [
              "items",
              "items.variant",
              "items.variant.product",
              "shipping_address",
              "billing_address"
            ],
            order: {
              created_at: "DESC"
            }
          }
        )

        return res.json({
          success: true,
          data: {
            orders,
            count: orders.length,
            total_count: count,
            limit,
            offset
          },
          metadata: {
            email,
            source: 'order_module_direct'
          }
        })
      }

      return res.status(503).json({
        success: false,
        error: "Order service not available",
        message: "Unable to retrieve orders at this time"
      })
    }

    // Use the custom order service list method
    const result = await orderService.list({
      email: email.toLowerCase(),
      limit,
      offset
    })

    return res.json({
      success: true,
      data: {
        orders: result.orders,
        count: result.orders.length,
        total_count: result.count,
        limit,
        offset
      },
      metadata: {
        email,
        source: 'order_service'
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}