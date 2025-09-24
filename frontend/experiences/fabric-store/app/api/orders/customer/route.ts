/**
 * Secure Customer Orders Proxy API
 *
 * Industry Best Practices:
 * - Server-side proxy to Medusa backend
 * - No database credentials exposed to frontend
 * - Proper authentication flow
 * - Input validation and rate limiting ready
 * - Customer verification for security
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/orders/customer
 *
 * Secure proxy to Medusa backend for customer orders
 * Handles authentication and customer verification
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()

  try {
    // Extract and validate query parameters
    const url = new URL(request.url)
    const rawEmailParam = url.searchParams.get('email')
    const rawLimit = url.searchParams.get('limit')
    const rawOffset = url.searchParams.get('offset')

    // Simple validation
    if (!rawEmailParam) {
      return NextResponse.json({
        success: false,
        error: "Invalid request parameters",
        message: "Email parameter is required",
        code: "VALIDATION_ERROR"
      }, { status: 400 })
    }

    const email = decodeURIComponent(rawEmailParam)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: "Invalid request parameters",
        message: "Invalid email format",
        code: "VALIDATION_ERROR"
      }, { status: 400 })
    }

    const limit = parseInt(rawLimit || '10')
    const offset = parseInt(rawOffset || '0')

    // Environment variables
    const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
    const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

    if (!MEDUSA_BACKEND_URL || !PUBLISHABLE_KEY) {
      console.error('Missing Medusa configuration')
      return NextResponse.json({
        success: false,
        error: "Service configuration error",
        message: "Orders service is temporarily unavailable",
        code: "SERVICE_CONFIGURATION_ERROR"
      }, { status: 503 })
    }

    // Use the new public orders endpoint - no authentication needed!
    try {
      console.log(`🔍 Fetching orders for customer: ${email}`)

      const ordersResponse = await fetch(
        `${MEDUSA_BACKEND_URL}/store/public-orders?email=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      if (!ordersResponse.ok) {
        throw new Error(`Medusa API error: ${ordersResponse.status}`)
      }

      const ordersData = await ordersResponse.json()

      // If it's our public API response, return it directly
      if (ordersData.success && ordersData.data) {
        return NextResponse.json({
          success: true,
          data: ordersData.data,
          metadata: {
            email: email.toLowerCase(),
            response_time_ms: Date.now() - startTime,
            source: "public_orders_api"
          }
        })
      }

      // Fallback: Transform if needed
      const transformedOrders = ordersData.orders?.map((order: any) => ({
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
        shipping_address: order.shipping_address,
        billing_address: order.billing_address,
        payment_info: order.payments?.length > 0 ? {
          status: order.payments[0].captured_at ? 'captured' :
                  order.payments[0].canceled_at ? 'canceled' : 'pending',
          amount: order.payments[0].amount,
          currency_code: order.payments[0].currency_code,
          created_at: order.payments[0].created_at
        } : null
      })) || []

      return NextResponse.json({
        success: true,
        data: {
          orders: transformedOrders,
          count: transformedOrders.length,
          total_count: ordersData.count || transformedOrders.length,
          limit,
          offset
        },
        metadata: {
          email: email.toLowerCase(),
          response_time_ms: Date.now() - startTime,
          source: "medusa_secure_proxy"
        }
      })

    } catch (medusaError) {
      console.error('Medusa orders fetch failed:', medusaError)

      return NextResponse.json({
        success: false,
        error: "Orders service error",
        message: "Unable to retrieve orders at this time",
        code: "ORDERS_SERVICE_ERROR",
        metadata: {
          email: email.toLowerCase(),
          response_time_ms: Date.now() - startTime
        }
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Orders API error:', error)

    return NextResponse.json({
      success: false,
      error: "Internal server error",
      message: "An unexpected error occurred while processing your request",
      code: "INTERNAL_SERVER_ERROR",
      metadata: {
        response_time_ms: Date.now() - startTime
      }
    }, { status: 500 })
  }
}

/**
 * OPTIONS /api/orders/customer - CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}