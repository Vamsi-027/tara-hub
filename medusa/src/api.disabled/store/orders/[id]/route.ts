/**
 * Store Order Details API
 * Fetches a specific order by ID for the authenticated customer
 * Ensures customers can only access their own orders
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /store/orders/:id
 * Fetch a specific order's details by orderId
 * - Authenticated customers: Can only view their own orders
 * - Guest users: Can view any order by ID (for guest checkout support)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Get the order ID from the path parameter
    const orderId = req.params.id

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Order ID required",
        message: "Please provide a valid order ID"
      })
    }

    // Get the authenticated customer from session/context if available
    const customerId = req.user?.customer_id ||
                      req.session?.customer_id ||
                      req.auth?.actor_id

    // Guest users are allowed to look up orders by ID
    // This supports guest checkout scenarios

    // Get the query service
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Fetch the order with all related data
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status",
        "email",
        "customer_id",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "shipping_total",
        "discount_total",
        "gift_card_total",
        "created_at",
        "updated_at",
        "metadata",
        "items.*",
        "items.variant.*",
        "items.variant.product.*",
        "items.tax_lines.*",
        "items.adjustments.*",
        "shipping_address.*",
        "billing_address.*",
        "shipping_methods.*",
        "shipping_methods.tax_lines.*",
        "payment_collections.*",
        "payment_collections.payments.*",
        "fulfillments.*",
        "fulfillments.items.*",
        "returns.*",
        "returns.items.*",
        "claims.*",
        "claims.items.*",
        "refunds.*",
        "swaps.*",
        "discounts.*"
      ],
      filters: {
        id: orderId
      }
    })

    // Check if order exists
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found",
        message: `No order found with ID ${orderId}`
      })
    }

    const order = orders[0]

    // Authorization check:
    // - If user is authenticated: verify the order belongs to them
    // - If user is a guest: allow access (they have the order ID)
    if (customerId && order.customer_id && order.customer_id !== customerId) {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You do not have permission to view this order. This order belongs to a different customer."
      })
    }

    // Transform the order to a detailed response format
    const transformedOrder = {
      id: order.id,
      display_id: order.display_id,
      status: order.status,
      email: order.email,
      currency_code: order.currency_code,
      created_at: order.created_at,
      updated_at: order.updated_at,
      metadata: order.metadata || {},

      // Detailed items with all information
      items: order.items?.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        fulfilled_quantity: item.fulfilled_quantity,
        returned_quantity: item.returned_quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        tax_total: item.tax_total,
        total: item.total,
        original_total: item.original_total,
        discount_total: item.discount_total,
        metadata: item.metadata || {},

        // Variant details
        variant: item.variant ? {
          id: item.variant.id,
          title: item.variant.title,
          sku: item.variant.sku,
          barcode: item.variant.barcode,
          inventory_quantity: item.variant.inventory_quantity,
          product: item.variant.product ? {
            id: item.variant.product.id,
            title: item.variant.product.title,
            handle: item.variant.product.handle,
            description: item.variant.product.description,
            thumbnail: item.variant.product.thumbnail
          } : null
        } : null,

        // Tax lines
        tax_lines: item.tax_lines?.map((tax: any) => ({
          id: tax.id,
          name: tax.name,
          code: tax.code,
          rate: tax.rate,
          total: tax.total
        })) || [],

        // Adjustments (discounts, etc.)
        adjustments: item.adjustments?.map((adj: any) => ({
          id: adj.id,
          description: adj.description,
          amount: adj.amount,
          discount_id: adj.discount_id
        })) || []
      })) || [],

      // Detailed totals breakdown
      totals: {
        subtotal: order.subtotal,
        tax_total: order.tax_total,
        shipping_total: order.shipping_total,
        discount_total: order.discount_total,
        gift_card_total: order.gift_card_total || 0,
        total: order.total
      },

      // Full address information
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
        country_code: order.shipping_address.country_code,
        metadata: order.shipping_address.metadata || {}
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
        country_code: order.billing_address.country_code,
        metadata: order.billing_address.metadata || {}
      } : null,

      // Shipping methods with details
      shipping_methods: order.shipping_methods?.map((method: any) => ({
        id: method.id,
        name: method.name,
        price: method.price,
        data: method.data,
        tax_lines: method.tax_lines?.map((tax: any) => ({
          id: tax.id,
          name: tax.name,
          code: tax.code,
          rate: tax.rate,
          total: tax.total
        })) || []
      })) || [],

      // Payment information
      payment_collections: order.payment_collections?.map((collection: any) => ({
        id: collection.id,
        status: collection.status,
        amount: collection.amount,
        created_at: collection.created_at,
        payments: collection.payments?.map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          currency_code: payment.currency_code,
          provider_id: payment.provider_id,
          data: payment.data,
          captured_at: payment.captured_at,
          canceled_at: payment.canceled_at,
          created_at: payment.created_at
        })) || []
      })) || [],

      // Fulfillment details with tracking
      fulfillments: order.fulfillments?.map((fulfillment: any) => ({
        id: fulfillment.id,
        status: fulfillment.status,
        tracking_numbers: fulfillment.tracking_numbers || [],
        tracking_links: fulfillment.tracking_links || [],
        shipped_at: fulfillment.shipped_at,
        delivered_at: fulfillment.delivered_at,
        canceled_at: fulfillment.canceled_at,
        created_at: fulfillment.created_at,
        updated_at: fulfillment.updated_at,
        metadata: fulfillment.metadata || {},
        items: fulfillment.items?.map((item: any) => ({
          item_id: item.line_item_id,
          quantity: item.quantity
        })) || []
      })) || [],

      // Returns if any
      returns: order.returns?.map((ret: any) => ({
        id: ret.id,
        status: ret.status,
        reason: ret.reason,
        note: ret.note,
        refund_amount: ret.refund_amount,
        received_at: ret.received_at,
        created_at: ret.created_at,
        items: ret.items?.map((item: any) => ({
          item_id: item.item_id,
          quantity: item.quantity,
          reason: item.reason,
          note: item.note
        })) || []
      })) || [],

      // Refunds if any
      refunds: order.refunds?.map((refund: any) => ({
        id: refund.id,
        amount: refund.amount,
        reason: refund.reason,
        note: refund.note,
        created_at: refund.created_at
      })) || [],

      // Applied discounts
      discounts: order.discounts?.map((discount: any) => ({
        id: discount.id,
        code: discount.code,
        description: discount.rule?.description,
        type: discount.rule?.type,
        value: discount.rule?.value,
        allocation: discount.rule?.allocation
      })) || [],

      // Timeline events (order history)
      timeline: [
        {
          status: 'created',
          timestamp: order.created_at,
          message: 'Order placed'
        },
        ...(order.payment_collections?.[0]?.payments?.[0]?.captured_at ? [{
          status: 'paid',
          timestamp: order.payment_collections[0].payments[0].captured_at,
          message: 'Payment confirmed'
        }] : []),
        ...(order.fulfillments?.flatMap((f: any) => [
          f.shipped_at ? {
            status: 'shipped',
            timestamp: f.shipped_at,
            message: `Order shipped${f.tracking_numbers?.length ? ` - Tracking: ${f.tracking_numbers.join(', ')}` : ''}`
          } : null,
          f.delivered_at ? {
            status: 'delivered',
            timestamp: f.delivered_at,
            message: 'Order delivered'
          } : null
        ].filter(Boolean)) || []),
        ...(order.returns?.map((r: any) => ({
          status: 'returned',
          timestamp: r.created_at,
          message: `Return initiated - Reason: ${r.reason || 'Not specified'}`
        })) || [])
      ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }

    return res.status(200).json({
      success: true,
      order: transformedOrder
    })

  } catch (error) {
    console.error('Error fetching order details:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch order details',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}