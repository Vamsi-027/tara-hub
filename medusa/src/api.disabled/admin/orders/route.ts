/**
 * Admin Orders API
 * Fetches all orders from all customers for admin users
 * Properly restricted to admin users only
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * GET /admin/orders
 * Fetch the list of all orders from all customers
 * Requires admin authentication
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Check for admin authentication
    // Medusa v2 uses auth context for admin authentication
    const isAdmin = req.auth?.actor_type === 'user' ||
                   req.user?.type === 'admin' ||
                   req.user?.role === 'admin' ||
                   req.session?.user_id

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
        message: "You must be authenticated as an admin user to access this endpoint"
      })
    }

    // Get the query service
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Query parameters for filtering, pagination, and sorting
    const {
      limit = "50",
      offset = "0",
      status,
      customer_id,
      email,
      created_at_gte,
      created_at_lte,
      sort = "created_at:desc",
      q
    } = req.query as Record<string, string>

    // Build filters
    const filters: any = {}

    if (status) {
      filters.status = status.split(',')
    }

    if (customer_id) {
      filters.customer_id = customer_id
    }

    if (email) {
      filters.email = { $like: `%${email}%` }
    }

    if (created_at_gte || created_at_lte) {
      filters.created_at = {}
      if (created_at_gte) {
        filters.created_at.$gte = new Date(created_at_gte)
      }
      if (created_at_lte) {
        filters.created_at.$lte = new Date(created_at_lte)
      }
    }

    // Search query (searches in order ID, email, customer name)
    if (q) {
      filters.$or = [
        { display_id: { $like: `%${q}%` } },
        { email: { $like: `%${q}%` } },
        { "shipping_address.first_name": { $like: `%${q}%` } },
        { "shipping_address.last_name": { $like: `%${q}%` } }
      ]
    }

    // Parse sort parameter
    const [sortField, sortOrder] = sort.split(':')
    const orderBy = { [sortField]: sortOrder === 'asc' ? 'ASC' : 'DESC' }

    // Fetch all orders with comprehensive data
    const { data: orders, metadata } = await query.graph({
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
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.total",
        "items.variant.sku",
        "items.variant.title",
        "items.variant.product.title",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.country_code",
        "billing_address.first_name",
        "billing_address.last_name",
        "customer.id",
        "customer.email",
        "customer.first_name",
        "customer.last_name",
        "customer.phone",
        "customer.created_at",
        "payment_collections.id",
        "payment_collections.status",
        "payment_collections.amount",
        "payment_collections.payments.id",
        "payment_collections.payments.amount",
        "payment_collections.payments.captured_at",
        "payment_collections.payments.provider_id",
        "fulfillments.id",
        "fulfillments.status",
        "fulfillments.shipped_at",
        "fulfillments.delivered_at",
        "fulfillments.tracking_numbers",
        "returns.id",
        "returns.status",
        "returns.refund_amount",
        "refunds.id",
        "refunds.amount",
        "claims.id",
        "claims.type",
        "swaps.id"
      ],
      filters,
      pagination: {
        take: parseInt(limit),
        skip: parseInt(offset)
      },
      orderBy
    })

    // Calculate statistics
    const stats = {
      total_orders: metadata?.total || 0,
      total_revenue: orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
      average_order_value: metadata?.total > 0
        ? orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) / orders.length
        : 0,
      status_breakdown: orders.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {}),
      payment_status_breakdown: orders.reduce((acc: any, order: any) => {
        const paymentStatus = order.payment_collections?.[0]?.status || 'pending'
        acc[paymentStatus] = (acc[paymentStatus] || 0) + 1
        return acc
      }, {}),
      fulfillment_status_breakdown: orders.reduce((acc: any, order: any) => {
        const fulfillmentStatus = order.fulfillments?.length > 0
          ? order.fulfillments[0].status
          : 'not_fulfilled'
        acc[fulfillmentStatus] = (acc[fulfillmentStatus] || 0) + 1
        return acc
      }, {})
    }

    // Transform orders for admin view
    const transformedOrders = orders.map((order: any) => ({
      id: order.id,
      display_id: order.display_id,
      status: order.status,
      email: order.email,
      customer_id: order.customer_id,
      currency_code: order.currency_code,
      created_at: order.created_at,
      updated_at: order.updated_at,

      // Customer information
      customer: order.customer ? {
        id: order.customer.id,
        email: order.customer.email,
        first_name: order.customer.first_name,
        last_name: order.customer.last_name,
        phone: order.customer.phone,
        created_at: order.customer.created_at,
        total_orders: orders.filter((o: any) => o.customer_id === order.customer.id).length,
        total_spent: orders
          .filter((o: any) => o.customer_id === order.customer.id)
          .reduce((sum: number, o: any) => sum + (o.total || 0), 0)
      } : null,

      // Order items summary
      items_count: order.items?.length || 0,
      items_summary: order.items?.slice(0, 3).map((item: any) => ({
        title: item.title,
        quantity: item.quantity,
        sku: item.variant?.sku,
        total: item.total
      })) || [],

      // Totals
      totals: {
        subtotal: order.subtotal,
        tax_total: order.tax_total,
        shipping_total: order.shipping_total,
        discount_total: order.discount_total,
        gift_card_total: order.gift_card_total || 0,
        total: order.total
      },

      // Addresses summary
      shipping_address: order.shipping_address ? {
        name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`.trim(),
        city: order.shipping_address.city,
        province: order.shipping_address.province,
        country_code: order.shipping_address.country_code
      } : null,

      // Payment status
      payment_status: order.payment_collections?.[0]?.status || 'pending',
      payment_amount: order.payment_collections?.[0]?.amount || 0,
      payment_provider: order.payment_collections?.[0]?.payments?.[0]?.provider_id || null,
      paid_at: order.payment_collections?.[0]?.payments?.[0]?.captured_at || null,

      // Fulfillment status
      fulfillment_status: order.fulfillments?.length > 0
        ? order.fulfillments[0].status
        : 'not_fulfilled',
      shipped_at: order.fulfillments?.[0]?.shipped_at || null,
      delivered_at: order.fulfillments?.[0]?.delivered_at || null,
      tracking_numbers: order.fulfillments?.flatMap((f: any) => f.tracking_numbers || []) || [],

      // Returns and refunds
      has_returns: (order.returns?.length || 0) > 0,
      returns_count: order.returns?.length || 0,
      total_refunded: order.refunds?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0,

      // Claims and swaps
      has_claims: (order.claims?.length || 0) > 0,
      has_swaps: (order.swaps?.length || 0) > 0,

      // Metadata
      metadata: order.metadata || {},

      // Risk indicators
      risk_score: calculateRiskScore(order),
      flags: getOrderFlags(order)
    }))

    // Return comprehensive response
    return res.status(200).json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      total: metadata?.total || 0,
      has_more: metadata?.has_more || false,
      statistics: stats
    })

  } catch (error) {
    console.error('Error fetching admin orders:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

/**
 * Calculate risk score for an order
 */
function calculateRiskScore(order: any): string {
  let score = 0

  // High value order
  if (order.total > 100000) score += 2 // Over $1000

  // No payment captured
  if (!order.payment_collections?.[0]?.payments?.[0]?.captured_at) score += 3

  // Multiple returns
  if ((order.returns?.length || 0) > 1) score += 2

  // High refund amount
  const refundTotal = order.refunds?.reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0
  if (refundTotal > order.total * 0.5) score += 3

  // New customer (first order)
  if (!order.customer?.created_at ||
      new Date(order.customer.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    score += 1
  }

  if (score >= 5) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

/**
 * Get order flags for quick identification of issues
 */
function getOrderFlags(order: any): string[] {
  const flags: string[] = []

  // Payment issues
  if (!order.payment_collections?.[0]?.payments?.[0]?.captured_at) {
    flags.push('payment_pending')
  }

  // Fulfillment issues
  if (order.status === 'pending' &&
      new Date(order.created_at) < new Date(Date.now() - 48 * 60 * 60 * 1000)) {
    flags.push('unfulfilled_48h')
  }

  // Returns
  if ((order.returns?.length || 0) > 0) {
    flags.push('has_returns')
  }

  // High value
  if (order.total > 100000) { // Over $1000
    flags.push('high_value')
  }

  // International
  if (order.shipping_address?.country_code &&
      order.shipping_address.country_code !== 'us') {
    flags.push('international')
  }

  return flags
}