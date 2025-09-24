/**
 * Custom Store API endpoint to fetch order by ID
 * GET /store/orders/:id
 *
 * This endpoint allows fetching a specific order by its ID
 * without requiring authentication or email verification
 *
 * Note: This is a public endpoint for order lookup functionality
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const orderId = req.params.id

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

    // Fetch the order by ID
    const order = await orderService.retrieve(orderId, {
      relations: [
        "items",
        "items.variant",
        "items.variant.product",
        "shipping_address",
        "billing_address",
        "region",
        "payment_collection",
        "payment_collection.payment_sessions"
      ]
    }).catch((error) => {
      console.error(`Failed to retrieve order ${orderId}:`, error)
      return null
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
        message: `No order found with ID: ${orderId}`
      })
    }

    // Transform the order for consistent API response
    const transformedOrder = {
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
      billing_address: order.billing_address,
      metadata: order.metadata
    }

    return res.json({
      success: true,
      order: transformedOrder
    })

  } catch (error) {
    console.error("Error fetching order:", error)

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while fetching the order"
    })
  }
}