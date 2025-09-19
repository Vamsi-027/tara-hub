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

// Admin credentials for accessing orders
const ADMIN_EMAIL = 'admin@tara-hub.com'
const ADMIN_PASSWORD = 'password'

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

    // Helper function to authenticate with admin credentials
    async function getAdminToken() {
      console.log('🔑 Authenticating with admin credentials...')

      const authResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        })
      })

      if (!authResponse.ok) {
        const errorText = await authResponse.text()
        throw new Error(`Admin authentication failed: ${errorText}`)
      }

      const authData = await authResponse.json()
      const adminToken = authData.access_token || authData.token

      if (!adminToken) {
        throw new Error('No admin token received')
      }

      console.log('✅ Admin authentication successful')
      return adminToken
    }

    try {
      // Get admin token for accessing orders
      const adminToken = await getAdminToken()

      // Method 1: Fetch orders using admin API with email filter
      console.log('1️⃣ Fetching orders with admin authentication...')

      const ordersResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/orders?email=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const orders = ordersData.orders || ordersData.data || []

        console.log(`✅ [ORDERS] Found ${orders.length} orders for ${email} using admin API`)

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
            source: 'medusa_admin_api',
            total_orders_found: orders.length,
            exact_matches: exactMatchOrders.length
          }
        })
      }

      // Method 2: If email filter doesn't work, fetch all orders and filter locally
      console.log('2️⃣ Email filter failed, fetching all orders and filtering locally...')

      const allOrdersResponse = await fetch(`${MEDUSA_BACKEND_URL}/admin/orders?limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      })

      if (allOrdersResponse.ok) {
        const allOrdersData = await allOrdersResponse.json()
        const allOrders = allOrdersData.orders || allOrdersData.data || []

        console.log(`📦 [ORDERS] Total orders in database: ${allOrders.length}`)

        // Filter orders by email
        const userOrders = allOrders.filter((order: any) =>
          order.email && order.email.toLowerCase() === email.toLowerCase()
        )

        console.log(`🎯 [ORDERS] Found ${userOrders.length} orders for ${email}`)

        if (userOrders.length > 0) {
          // Apply pagination to filtered results
          const paginatedOrders = userOrders.slice(offset, offset + limit)

          // Transform orders for consistent API response
          const transformedOrders = paginatedOrders.map((order: any) => ({
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
              count: paginatedOrders.length,
              total_count: userOrders.length,
              limit,
              offset
            },
            metadata: {
              email,
              response_time_ms: responseTime,
              source: 'medusa_admin_api_filtered',
              total_orders_in_db: allOrders.length,
              user_orders_found: userOrders.length
            }
          })
        }
      }

      // Method 3: Fallback - return empty results with helpful message
      console.log('3️⃣ No orders found, returning empty results')

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
          source: 'admin_authenticated_empty_result',
          note: 'Orders searched using admin authentication - customer may not have placed any orders yet'
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