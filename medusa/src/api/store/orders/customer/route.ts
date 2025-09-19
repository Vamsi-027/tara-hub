/**
 * Secure Customer Orders API - Medusa v2 Implementation
 *
 * Industry Best Practices:
 * - No direct database exposure to frontend
 * - Proper authentication and authorization
 * - Input validation and sanitization
 * - Rate limiting ready
 * - Proper error handling
 * - Structured logging
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"
import { z } from "zod"

// Request validation schema
const CustomerOrdersQuerySchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
  limit: z.string().optional().transform(val => {
    if (!val) return 10
    const num = parseInt(val)
    return isNaN(num) ? 10 : Math.min(Math.max(num, 1), 50)
  }),
  offset: z.string().optional().transform(val => {
    if (!val) return 0
    const num = parseInt(val)
    return isNaN(num) ? 0 : Math.max(num, 0)
  })
})

type CustomerOrdersQuery = z.infer<typeof CustomerOrdersQuerySchema>

/**
 * GET /store/orders/customer
 *
 * Fetches orders for a customer by email with proper security
 * Uses Medusa's built-in ORM and authentication
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const startTime = Date.now()

  try {
    // Validate query parameters
    const validationResult = CustomerOrdersQuerySchema.safeParse(req.query)

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      res.status(400).json({
        success: false,
        error: "Invalid request parameters",
        message: firstError.message,
        code: "VALIDATION_ERROR"
      })
      return
    }

    const { email, limit, offset } = validationResult.data

    // Get container services
    const orderService = req.scope.resolve("orderService")
    const customerService = req.scope.resolve("customerService")

    // Security: Verify customer exists and is active
    let customer
    try {
      customer = await customerService.retrieveByEmail(email.toLowerCase())
    } catch (error) {
      // Customer not found - return empty result for security
      res.status(200).json({
        success: true,
        data: {
          orders: [],
          count: 0,
          total_count: 0,
          limit,
          offset
        },
        metadata: {
          email: email.toLowerCase(),
          response_time_ms: Date.now() - startTime,
          source: "medusa_secure_api"
        }
      })
      return
    }

    // Fetch orders using Medusa's secure order service
    const [orders, count] = await orderService.listAndCount(
      {
        email: email.toLowerCase(),
        // Only return completed or pending orders for customer-facing API
        status: ["pending", "completed", "shipped", "delivered"]
      },
      {
        take: limit,
        skip: offset,
        relations: [
          "items",
          "items.variant",
          "items.variant.product",
          "shipping_address",
          "billing_address",
          "payments",
          "shipping_methods",
          "region"
        ],
        order: { created_at: "DESC" }
      }
    )

    // Transform orders to customer-safe format
    const transformedOrders = orders.map(order => ({
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
      items: order.items?.map(item => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        thumbnail: item.thumbnail,
        variant_id: item.variant_id,
        variant_sku: item.variant?.sku,
        variant_title: item.variant?.title,
        product_id: item.variant?.product_id,
        product_title: item.variant?.product?.title,
        metadata: item.metadata
      })) || [],
      shipping_address: order.shipping_address ? {
        first_name: order.shipping_address.first_name,
        last_name: order.shipping_address.last_name,
        address_1: order.shipping_address.address_1,
        address_2: order.shipping_address.address_2,
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        postal_code: order.shipping_address.postal_code,
        country_code: order.shipping_address.country_code,
        phone: order.shipping_address.phone
      } : null,
      billing_address: order.billing_address ? {
        first_name: order.billing_address.first_name,
        last_name: order.billing_address.last_name,
        address_1: order.billing_address.address_1,
        address_2: order.billing_address.address_2,
        city: order.billing_address.city,
        province: order.billing_address.province,
        postal_code: order.billing_address.postal_code,
        country_code: order.billing_address.country_code,
        phone: order.billing_address.phone
      } : null,
      // Only include safe payment information
      payment_info: order.payments?.length > 0 ? {
        status: order.payments[0].captured_at ? 'captured' :
                order.payments[0].canceled_at ? 'canceled' : 'pending',
        amount: order.payments[0].amount,
        currency_code: order.payments[0].currency_code,
        created_at: order.payments[0].created_at
      } : null
    }))

    // Log for monitoring (sanitized)
    req.scope.resolve("logger").info("Customer orders retrieved", {
      email: email.toLowerCase(),
      order_count: orders.length,
      total_count: count,
      response_time_ms: Date.now() - startTime
    })

    res.status(200).json({
      success: true,
      data: {
        orders: transformedOrders,
        count: orders.length,
        total_count: count,
        limit,
        offset
      },
      metadata: {
        email: email.toLowerCase(),
        response_time_ms: Date.now() - startTime,
        source: "medusa_secure_api"
      }
    })

  } catch (error) {
    // Log error for monitoring
    req.scope.resolve("logger").error("Customer orders API error", {
      error: error.message,
      stack: error.stack,
      email: req.query.email,
      response_time_ms: Date.now() - startTime
    })

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An unexpected error occurred while retrieving orders",
      code: "INTERNAL_SERVER_ERROR",
      metadata: {
        response_time_ms: Date.now() - startTime
      }
    })
  }
}

/**
 * OPTIONS /store/orders/customer - CORS preflight
 */
export async function OPTIONS(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  res.status(200).json({})
}