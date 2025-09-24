/**
 * Custom Store API endpoint to fetch orders by customer email
 * GET /store/orders/customer?email=customer@example.com
 *
 * This endpoint allows fetching orders for a specific customer email
 *
 * Note: This is a public endpoint for customer order lookup
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const email = req.query.email as string
  const limit = parseInt(req.query.limit as string) || 10
  const offset = parseInt(req.query.offset as string) || 0

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Missing required parameter",
      message: "Email parameter is required"
    })
  }

  try {
    // Get the order service from the request scope
    const orderService = req.scope.resolve("orderService")

    if (!orderService) {
      return res.status(500).json({
        success: false,
        error: "Order service not available",
        message: "Unable to retrieve orders at this time"
      })
    }

    // Fetch orders by customer email
    const [orders, count] = await orderService.listAndCount(
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
    ).catch((error) => {
      console.error(`Failed to retrieve orders for ${email}:`, error)
      return [[], 0]
    })

    // Transform orders for consistent API response
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      display_id: order.display_id,
      email: order.email,
      status: order.status,
      payment_status: order.payment_status,
      fulfillment_status: order.fulfillment_status,
      total: order.total,
      subtotal: order.subtotal,
      tax_total: order.tax_total,
      shipping_total: order.shipping_total,
      currency_code: order.currency_code,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: order.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        thumbnail: item.thumbnail,
        variant: {
          id: item.variant_id,
          title: item.variant?.title,
          sku: item.variant?.sku
        },
        product: {
          id: item.variant?.product_id,
          title: item.variant?.product?.title
        }
      })) || [],
      shipping_address: order.shipping_address,
      billing_address: order.billing_address
    }))

    return res.json({
      success: true,
      data: {
        orders: transformedOrders,
        count: transformedOrders.length,
        total_count: count,
        limit,
        offset
      },
      metadata: {
        email,
        source: 'medusa_custom_api'
      }
    })

  } catch (error) {
    console.error("Error fetching customer orders:", error)

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while fetching orders"
    })
  }
}