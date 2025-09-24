/**
 * Orders API - Industry Standard Implementation
 * Fetches customer orders from Medusa backend with proper validation and security
 *
 * GET /api/orders?email=customer@email.com
 * - Fetches orders for a specific customer email
 * - Includes proper validation, sanitization, and error handling
 * - Follows REST API best practices
 */

import { NextRequest, NextResponse } from 'next/server'

// Use production URL as fallback if env var is not set
const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                           process.env.MEDUSA_BACKEND_URL ||
                           'https://medusa-backend-production-3655.up.railway.app'

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
                       'pk_52c908c87d04f835cc7b96e7579083f06603e4997fc42f7358c69dcff8f17d38'

// Email validation regex - RFC 5322 compliant
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * GET /api/orders - Fetch customer orders
 * Query Parameters:
 * - id: Order ID to fetch specific order (optional)
 * - email: Customer email address (optional if id provided)
 * - limit: Number of orders to return (optional, default: 10, max: 50)
 * - offset: Number of orders to skip (optional, default: 0)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    const email = searchParams.get('email')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // Input validation - require either orderId or email
    if (!orderId && !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter',
        message: 'Either order ID or email parameter is required',
        code: 'MISSING_PARAMETER'
      }, { status: 400 })
    }

    // If fetching by order ID, skip email validation
    if (!orderId) {
      // Email format validation only if email is provided and no orderId
      if (email && !EMAIL_REGEX.test(email)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid email format',
          message: 'Please provide a valid email address',
          code: 'INVALID_EMAIL_FORMAT'
        }, { status: 400 })
      }
    }

    // Parse and validate pagination parameters
    const limit = Math.min(parseInt(limitParam || '10'), 50) // Max 50 orders per request
    const offset = Math.max(parseInt(offsetParam || '0'), 0)

    if (isNaN(limit) || isNaN(offset)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pagination parameters',
        message: 'Limit and offset must be valid numbers',
        code: 'INVALID_PAGINATION'
      }, { status: 400 })
    }

    console.log(`🔍 [ORDERS] Fetching orders - ID: ${orderId || 'none'}, Email: ${email || 'none'}`)
    console.log(`📄 [ORDERS] Pagination: limit=${limit}, offset=${offset}`)

    try {
      // If order ID is provided, fetch specific order using public endpoint
      if (orderId) {
        console.log('🆔 Fetching specific order by ID using public endpoint:', orderId)

        // Use public endpoint that doesn't require authentication
        const storeOrderResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/public-orders/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (storeOrderResponse.ok) {
          const orderData = await storeOrderResponse.json()
          const order = orderData.order || orderData

          console.log(`✅ [ORDERS] Found order ${orderId}`)

          // Transform order for consistent API response
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
            billing_address: order.billing_address
          }

          const responseTime = Date.now() - startTime

          return NextResponse.json({
            success: true,
            data: {
              orders: [transformedOrder],
              count: 1,
              total_count: 1,
              limit: 1,
              offset: 0
            },
            metadata: {
              order_id: orderId,
              response_time_ms: responseTime,
              source: 'medusa_store_api_by_id'
            }
          })
        } else if (storeOrderResponse.status === 404) {
          return NextResponse.json({
            success: false,
            error: 'Order not found',
            message: `No order found with ID: ${orderId}`,
            code: 'ORDER_NOT_FOUND'
          }, { status: 404 })
        } else {
          const errorText = await storeOrderResponse.text()
          console.error('❌ Failed to fetch order by ID from store API:', errorText)

          // Store API failed, return error
          return NextResponse.json({
            success: false,
            error: 'Unable to fetch order',
            message: `Could not retrieve order ${orderId}. Please try again later.`,
            code: 'ORDER_FETCH_ERROR',
            metadata: {
              order_id: orderId,
              response_time_ms: Date.now() - startTime
            }
          }, { status: 500 })
        }
      }

      // Method 1: Try fetching orders using store API first (no authentication needed)
      if (!email) {
        // If no email and we got here, it means orderId fetch failed
        return NextResponse.json({
          success: false,
          error: 'Unable to fetch order',
          message: 'Order could not be retrieved',
          code: 'FETCH_ERROR'
        }, { status: 500 })
      }

      console.log('1️⃣ Fetching orders for customer email...')

      // Use our custom customer orders endpoint
      const customerOrdersResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/orders/customer?email=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
        }
      })

      if (customerOrdersResponse.ok) {
        const ordersData = await customerOrdersResponse.json()
        const orders = ordersData.orders || ordersData.data || []

        console.log(`✅ [ORDERS] Found ${orders.length} orders for ${email} using store API`)

        // Filter orders to match the exact email (in case backend filter is case-sensitive or partial)
        const exactMatchOrders = orders.filter((order: any) =>
          order.email && order.email.toLowerCase() === email.toLowerCase()
        )

        console.log(`🎯 [ORDERS] Exact email matches: ${exactMatchOrders.length}`)

        // Transform orders for consistent API response
        const transformedOrders = exactMatchOrders.map((order: any) => ({
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

        const responseTime = Date.now() - startTime

        return NextResponse.json({
          success: true,
          data: {
            orders: transformedOrders,
            count: exactMatchOrders.length,
            total_count: ordersData.count || exactMatchOrders.length,
            limit,
            offset
          },
          metadata: {
            email,
            response_time_ms: responseTime,
            source: 'medusa_store_api',
            total_orders_found: orders.length,
            exact_matches: exactMatchOrders.length
          }
        })
      }

      // Method 2: If store API doesn't have email filter, return empty for now
      console.log('2️⃣ Store API does not support email filtering for orders')

      // Return empty results for now
      return NextResponse.json({
        success: true,
        data: {
          orders: [],
          count: 0,
          total_count: 0,
          limit,
          offset
        },
        message: 'Order history is currently unavailable. Please check back later.',
        metadata: {
          email,
          response_time_ms: Date.now() - startTime,
          source: 'store_api_no_email_filter'
        }
      })

    } catch (medusaError) {
      console.error('❌ [ORDERS] Medusa API error:', medusaError)

      // Return a user-friendly error
      return NextResponse.json({
        success: false,
        error: 'Orders service temporarily unavailable',
        message: 'Unable to fetch orders at this time. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
        metadata: {
          ...(orderId && { order_id: orderId }),
          ...(email && { email }),
          response_time_ms: Date.now() - startTime,
          error_details: medusaError instanceof Error ? medusaError.message : 'Unknown error'
        }
      }, { status: 503 })
    }

  } catch (error) {
    console.error('❌ [ORDERS] API error:', error)

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred while processing your request',
      code: 'INTERNAL_SERVER_ERROR',
      metadata: {
        response_time_ms: responseTime,
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError'
      }
    }, { status: 500 })
  }
}

/**
 * POST /api/orders - Create order (redirect to create endpoint)
 * This provides a consistent API interface
 */
export async function POST(request: NextRequest) {
  // Redirect to the specific create endpoint
  return NextResponse.json({
    success: false,
    error: 'Method not allowed',
    message: 'Use POST /api/orders/create to create new orders',
    redirect_to: '/api/orders/create'
  }, { status: 405 })
}

/**
 * OPTIONS /api/orders - CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}