/**
 * Store Orders by Email API Route
 * Public endpoint that queries orders by customer email
 * Bypasses Medusa v2 serialization issues
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const email = req.query.email as string
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      })
    }

    console.log(`🔍 Store orders query for email: ${email}`)

    // Get the query service for direct database access
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Query orders with minimal fields to avoid serialization issues
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
        "created_at",
        "updated_at",
        "metadata",
        // Basic item data
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.total",
        // Basic address data
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.address_1",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.postal_code",
        "shipping_address.country_code",
        // Payment data
        "payment_collections.status",
        "payment_collections.amount"
      ],
      filters: {
        email: email.toLowerCase()
      },
      pagination: {
        skip: offset,
        take: limit
      },
      orderBy: {
        created_at: "DESC"
      }
    })

    console.log(`✅ Found ${orders?.length || 0} orders for ${email}`)

    // Transform to fabric-store compatible format
    const transformedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      display_id: order.display_id,
      email: order.email,
      status: order.status || 'pending',
      currency_code: order.currency_code || 'usd',
      created_at: order.created_at,
      updated_at: order.updated_at,

      // Items
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        name: item.title || 'Unknown Product',
        title: item.title || 'Unknown Product',
        quantity: item.quantity || 1,
        price: item.unit_price || 0,
        unit_price: item.unit_price || 0,
        total: item.total || item.unit_price || 0,
      })),

      // Shipping address
      shipping: order.shipping_address ? {
        firstName: order.shipping_address.first_name || '',
        lastName: order.shipping_address.last_name || '',
        email: order.email,
        phone: '',
        address: order.shipping_address.address_1 || '',
        city: order.shipping_address.city || '',
        state: order.shipping_address.province || '',
        zipCode: order.shipping_address.postal_code || '',
        country: order.shipping_address.country_code?.toUpperCase() || 'US',
      } : null,

      // Totals
      totals: {
        subtotal: order.subtotal || 0,
        shipping: order.shipping_total || 0,
        tax: order.tax_total || 0,
        total: order.total || 0,
      },

      // Payment info
      payment_status: order.payment_collections?.[0]?.status || 'pending',
      payment_amount: order.payment_collections?.[0]?.amount || order.total || 0,

      // Metadata
      metadata: order.metadata || {}
    }))

    return res.status(200).json({
      success: true,
      orders: transformedOrders,
      total: metadata?.total || transformedOrders.length,
      limit,
      offset,
      hasMore: offset + limit < (metadata?.total || 0)
    })

  } catch (error) {
    console.error('Store orders by email query error:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}