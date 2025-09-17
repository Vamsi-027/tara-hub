/**
 * Store Orders API
 * Handles customer order retrieval using Medusa's default order module
 * Properly scoped to authenticated customers only
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/orders
 * Fetch the logged-in customer's list of orders
 * Requires customer authentication - guest users cannot list orders
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Get the authenticated customer from session/context
    // Check multiple possible locations for customer ID
    const customerId = req.user?.customer_id ||
                      req.session?.customer_id ||
                      req.auth?.actor_id

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        message: "Please log in to view your order history. Guest users can only look up individual orders by order ID."
      })
    }

    // Get the order module service
    const orderModuleService = req.scope.resolve("order")
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Query parameters for pagination and filtering
    const {
      limit = "20",
      offset = "0",
      status,
      sort = "created_at:desc"
    } = req.query as Record<string, string>

    // Build filters for customer's orders
    const filters: any = {
      customer_id: customerId
    }

    // Add status filter if provided
    if (status) {
      filters.status = status
    }

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':')
    const orderBy = { [sortField]: sortOrder === 'asc' ? 'ASC' : 'DESC' }

    // Fetch customer's orders using Medusa's order module
    const { data: orders, metadata } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "email",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "discount_total",
        "created_at",
        "updated_at",
        "items.*",
        "items.variant.*",
        "items.product.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "payment_collections.*",
        "fulfillments.*",
        "fulfillments.items.*"
      ],
      filters,
      pagination: {
        take: parseInt(limit),
        skip: parseInt(offset)
      },
      orderBy
    })

    // Transform orders to a clean response format
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      display_id: order.display_id,
      status: order.status,
      email: order.email,
      currency_code: order.currency_code,
      created_at: order.created_at,
      updated_at: order.updated_at,

      // Items with details
      items: order.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        total: item.total,
        variant: {
          id: item.variant?.id,
          title: item.variant?.title,
          sku: item.variant?.sku,
          barcode: item.variant?.barcode
        },
        product: {
          id: item.product?.id,
          title: item.product?.title,
          handle: item.product?.handle
        }
      })) || [],

      // Totals
      totals: {
        subtotal: order.subtotal,
        tax_total: order.tax_total,
        shipping_total: order.shipping_total,
        discount_total: order.discount_total,
        total: order.total
      },

      // Addresses
      shipping_address: order.shipping_address ? {
        id: order.shipping_address.id,
        first_name: order.shipping_address.first_name,
        last_name: order.shipping_address.last_name,
        phone: order.shipping_address.phone,
        company: order.shipping_address.company,
        address_1: order.shipping_address.address_1,
        address_2: order.shipping_address.address_2,
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        postal_code: order.shipping_address.postal_code,
        country_code: order.shipping_address.country_code
      } : null,

      billing_address: order.billing_address ? {
        id: order.billing_address.id,
        first_name: order.billing_address.first_name,
        last_name: order.billing_address.last_name,
        phone: order.billing_address.phone,
        company: order.billing_address.company,
        address_1: order.billing_address.address_1,
        address_2: order.billing_address.address_2,
        city: order.billing_address.city,
        province: order.billing_address.province,
        postal_code: order.billing_address.postal_code,
        country_code: order.billing_address.country_code
      } : null,

      // Shipping methods
      shipping_methods: order.shipping_methods?.map((method: any) => ({
        id: method.id,
        name: method.name,
        price: method.price,
        data: method.data
      })) || [],

      // Payment status
      payment_status: order.payment_collections?.[0]?.status || 'pending',

      // Fulfillment status
      fulfillment_status: order.fulfillments?.length > 0
        ? order.fulfillments[0].status
        : 'not_fulfilled',

      // Fulfillments with tracking
      fulfillments: order.fulfillments?.map((fulfillment: any) => ({
        id: fulfillment.id,
        status: fulfillment.status,
        tracking_numbers: fulfillment.tracking_numbers,
        shipped_at: fulfillment.shipped_at,
        delivered_at: fulfillment.delivered_at,
        items: fulfillment.items?.map((item: any) => ({
          item_id: item.line_item_id,
          quantity: item.quantity
        })) || []
      })) || []
    }))

    // Return the response with pagination metadata
    return res.status(200).json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      has_more: metadata?.has_more || false
    })

  } catch (error) {
    console.error('Error fetching customer orders:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}