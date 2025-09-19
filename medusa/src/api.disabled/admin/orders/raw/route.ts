/**
 * Admin Raw Orders API
 * Direct database access to fetch orders without Medusa v2 serialization issues
 * This endpoint provides raw order data for admin users
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

/**
 * GET /admin/orders/raw
 * Fetch raw order data directly from the database
 * Bypasses Medusa v2 serialization to avoid potential issues
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Check for admin authentication
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

    // Get the database connection from MikroORM
    const em = req.scope.resolve("manager")

    // Query parameters
    const {
      limit = "50",
      offset = "0",
      status,
      email,
      search
    } = req.query as Record<string, string>

    // Build the query
    let query = `
      SELECT
        o.id,
        o.display_id,
        o.status,
        o.email,
        o.customer_id,
        o.currency_code,
        o.created_at,
        o.updated_at,
        o.metadata,
        o.total,
        o.subtotal,
        o.tax_total,
        o.shipping_total,
        o.discount_total,
        o.gift_card_total,
        o.raw_discount_total,

        -- Customer info
        c.id as customer_id,
        c.email as customer_email,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.phone as customer_phone,

        -- Shipping address
        sa.first_name as shipping_first_name,
        sa.last_name as shipping_last_name,
        sa.address_1 as shipping_address_1,
        sa.city as shipping_city,
        sa.province as shipping_province,
        sa.postal_code as shipping_postal_code,
        sa.country_code as shipping_country_code,

        -- Payment info
        pc.id as payment_collection_id,
        pc.status as payment_status,
        pc.amount as payment_amount,

        -- Items count
        (SELECT COUNT(*) FROM order_line_item WHERE order_id = o.id) as items_count,

        -- Fulfillment status
        (SELECT status FROM order_fulfillment WHERE order_id = o.id LIMIT 1) as fulfillment_status,
        (SELECT shipped_at FROM order_fulfillment WHERE order_id = o.id LIMIT 1) as shipped_at

      FROM "order" o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN order_shipping_address sa ON o.id = sa.order_id
      LEFT JOIN order_payment_collection pc ON o.id = pc.order_id
      WHERE 1=1
    `

    const params: any[] = []

    // Add filters
    if (status) {
      query += ` AND o.status = $${params.length + 1}`
      params.push(status)
    }

    if (email) {
      query += ` AND o.email ILIKE $${params.length + 1}`
      params.push(`%${email}%`)
    }

    if (search) {
      query += ` AND (
        o.email ILIKE $${params.length + 1} OR
        CAST(o.display_id AS TEXT) LIKE $${params.length + 2} OR
        sa.first_name ILIKE $${params.length + 3} OR
        sa.last_name ILIKE $${params.length + 4}
      )`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`)
    }

    // Add ordering and pagination
    query += ` ORDER BY o.created_at DESC`
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(parseInt(limit), parseInt(offset))

    // Execute query
    const rawOrders = await em.execute(query, params, 'get')

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM "order" o WHERE 1=1`
    const countParams: any[] = []

    if (status) {
      countQuery += ` AND o.status = $${countParams.length + 1}`
      countParams.push(status)
    }

    if (email) {
      countQuery += ` AND o.email ILIKE $${countParams.length + 1}`
      countParams.push(`%${email}%`)
    }

    const countResult = await em.execute(countQuery, countParams, 'get')
    const total = countResult[0]?.total || 0

    // Get line items for each order
    const orderIds = rawOrders.map((o: any) => o.id)
    let items: any[] = []

    if (orderIds.length > 0) {
      const itemsQuery = `
        SELECT
          oli.order_id,
          oli.id,
          oli.title,
          oli.subtitle,
          oli.thumbnail,
          oli.quantity,
          oli.unit_price,
          oli.subtotal,
          oli.total,
          pv.sku,
          p.title as product_title
        FROM order_line_item oli
        LEFT JOIN product_variant pv ON oli.variant_id = pv.id
        LEFT JOIN product p ON oli.product_id = p.id
        WHERE oli.order_id = ANY($1)
      `
      items = await em.execute(itemsQuery, [orderIds], 'get')
    }

    // Group items by order
    const itemsByOrder = items.reduce((acc: any, item: any) => {
      if (!acc[item.order_id]) {
        acc[item.order_id] = []
      }
      acc[item.order_id].push({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        thumbnail: item.thumbnail,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        total: item.total,
        sku: item.sku,
        product_title: item.product_title
      })
      return acc
    }, {})

    // Transform the raw orders
    const transformedOrders = rawOrders.map((order: any) => ({
      id: order.id,
      display_id: order.display_id,
      status: order.status,
      email: order.email,
      customer_id: order.customer_id,
      currency_code: order.currency_code,
      created_at: order.created_at,
      updated_at: order.updated_at,

      // Customer
      customer: order.customer_id ? {
        id: order.customer_id,
        email: order.customer_email,
        first_name: order.customer_first_name,
        last_name: order.customer_last_name,
        phone: order.customer_phone
      } : null,

      // Items
      items: itemsByOrder[order.id] || [],
      items_count: order.items_count || 0,

      // Totals
      totals: {
        subtotal: order.subtotal || 0,
        tax_total: order.tax_total || 0,
        shipping_total: order.shipping_total || 0,
        discount_total: order.discount_total || 0,
        gift_card_total: order.gift_card_total || 0,
        total: order.total || 0
      },

      // Shipping address
      shipping_address: order.shipping_first_name ? {
        first_name: order.shipping_first_name,
        last_name: order.shipping_last_name,
        address_1: order.shipping_address_1,
        city: order.shipping_city,
        province: order.shipping_province,
        postal_code: order.shipping_postal_code,
        country_code: order.shipping_country_code
      } : null,

      // Payment
      payment_status: order.payment_status || 'pending',
      payment_amount: order.payment_amount || 0,

      // Fulfillment
      fulfillment_status: order.fulfillment_status || 'not_fulfilled',
      shipped_at: order.shipped_at,

      // Metadata
      metadata: order.metadata || {}
    }))

    // Calculate statistics
    const stats = {
      total_orders: total,
      total_revenue: rawOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0),
      average_order_value: rawOrders.length > 0
        ? rawOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) / rawOrders.length
        : 0,
      status_breakdown: rawOrders.reduce((acc: any, order: any) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {}),
      payment_status_breakdown: rawOrders.reduce((acc: any, order: any) => {
        const status = order.payment_status || 'pending'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {}),
      fulfillment_status_breakdown: rawOrders.reduce((acc: any, order: any) => {
        const status = order.fulfillment_status || 'not_fulfilled'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
    }

    return res.status(200).json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length,
      offset: parseInt(offset),
      limit: parseInt(limit),
      total: total,
      has_more: parseInt(offset) + parseInt(limit) < total,
      statistics: stats
    })

  } catch (error) {
    console.error('Error fetching raw orders:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}