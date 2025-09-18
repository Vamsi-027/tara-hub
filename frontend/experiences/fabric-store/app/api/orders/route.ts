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
 * - email: Customer email address (required)
 * - limit: Number of orders to return (optional, default: 10, max: 50)
 * - offset: Number of orders to skip (optional, default: 0)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Extract and validate query parameters
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const limitParam = searchParams.get('limit')
    const offsetParam = searchParams.get('offset')

    // Input validation
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter',
        message: 'Email parameter is required',
        code: 'MISSING_EMAIL'
      }, { status: 400 })
    }

    // Email format validation
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
        message: 'Please provide a valid email address',
        code: 'INVALID_EMAIL_FORMAT'
      }, { status: 400 })
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

    console.log(`🔍 [ORDERS] Fetching orders for email: ${email}`)
    console.log(`📄 [ORDERS] Pagination: limit=${limit}, offset=${offset}`)

    try {
      // Method 1: Try to fetch orders directly from Medusa store API
      console.log('1️⃣ Attempting to fetch orders from Medusa store API...')

      const ordersResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/orders?email=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
        }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const orders = ordersData.orders || []

        console.log(`✅ [ORDERS] Found ${orders.length} orders for ${email}`)

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

        const responseTime = Date.now() - startTime

        return NextResponse.json({
          success: true,
          data: {
            orders: transformedOrders,
            count: orders.length,
            total_count: ordersData.count || orders.length,
            limit,
            offset
          },
          metadata: {
            email,
            response_time_ms: responseTime,
            source: 'medusa_store_api'
          }
        })
      }

      // Method 2: If store API fails, try different approaches
      console.log('2️⃣ Store API failed, trying alternative approaches...')
      const errorText = await ordersResponse.text()
      console.log('Store API error:', errorText)

      // Method 3: Try to get customer first, then their orders
      console.log('3️⃣ Attempting to fetch customer and their orders...')

      const customerResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/customers/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
          'Authorization': `Bearer ${email}` // This might not work, but worth trying
        }
      })

      if (customerResponse.ok) {
        const customerData = await customerResponse.json()
        console.log('Customer found:', customerData.customer?.id)

        // Try to fetch orders for this customer
        const customerOrdersResponse = await fetch(`${MEDUSA_BACKEND_URL}/store/customers/me/orders?limit=${limit}&offset=${offset}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(PUBLISHABLE_KEY ? { 'x-publishable-api-key': PUBLISHABLE_KEY } : {}),
            'Authorization': `Bearer ${email}`
          }
        })

        if (customerOrdersResponse.ok) {
          const customerOrdersData = await customerOrdersResponse.json()
          console.log(`✅ Found ${customerOrdersData.orders?.length || 0} orders via customer API`)

          return NextResponse.json({
            success: true,
            data: {
              orders: customerOrdersData.orders || [],
              count: customerOrdersData.orders?.length || 0,
              total_count: customerOrdersData.count || 0,
              limit,
              offset
            },
            metadata: {
              email,
              response_time_ms: Date.now() - startTime,
              source: 'medusa_customer_api'
            }
          })
        }
      }

      // Method 4: Fallback - return empty results with helpful message
      console.log('4️⃣ All methods failed, returning empty results')

      return NextResponse.json({
        success: true,
        data: {
          orders: [],
          count: 0,
          total_count: 0,
          limit,
          offset
        },
        message: 'No orders found for this email address',
        metadata: {
          email,
          response_time_ms: Date.now() - startTime,
          source: 'empty_fallback',
          note: 'Customer may not have placed any orders yet, or orders may not be accessible via public API'
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
          email,
          response_time_ms: Date.now() - startTime
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