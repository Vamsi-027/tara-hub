/**
 * Orders API Route
 * Production-ready API endpoint for order management
 * Uses Medusa v2 backend with proper error handling and logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { medusaV2Service, type Order } from '@/lib/services/medusa-v2.service'
import { orderService, OrderStatus } from '@/lib/services/order.service'
import { withCors } from '@/lib/cors'
import { z } from 'zod'

// Request validation schemas
const GetOrdersQuerySchema = z.object({
  id: z.string().optional(),
  email: z.string().email().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
})

const CreateOrderBodySchema = z.object({
  orderId: z.string().optional(),
  email: z.string().email(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string().optional().default('Unknown Product'),
    sku: z.string().optional().default(''),
    color: z.string().optional().default(''),
    price: z.number(),
    quantity: z.number().min(1),
    image: z.string().optional(),
  })).min(1),
  shipping: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().optional(),
  }),
  total: z.number().min(0),
  paymentIntentId: z.string().optional(),
  status: z.nativeEnum(OrderStatus).optional().default(OrderStatus.PENDING),
})

const UpdateOrderBodySchema = z.object({
  orderId: z.string(),
  status: z.nativeEnum(OrderStatus).optional(),
  notes: z.string().optional(),
  tracking: z.string().optional(),
})

/**
 * GET /api/orders
 * Retrieve orders by ID, email, or status using Medusa v2 API
 */
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse and validate query parameters
    const query = GetOrdersQuerySchema.parse({
      id: searchParams.get('id') || undefined,
      email: searchParams.get('email') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    })

    console.log(`📥 Orders API request:`, { query })

    // Get single order by ID
    if (query.id) {
      try {
        // Try fallback storage first (since many orders are stored there)
        console.log(`🔄 Checking fallback storage for ${query.id}`)
        const fallbackOrder = await orderService.getOrder(query.id)

        if (fallbackOrder) {
          console.log(`✅ Found order ${query.id} in fallback storage`)
          return NextResponse.json({
            success: true,
            order: fallbackOrder,
          })
        }

        // Try new Medusa v2 service for native Medusa orders
        console.log(`🔄 Checking Medusa v2 for ${query.id}`)
        const order = await medusaV2Service.getOrderById(query.id)

        if (order) {
          console.log(`✅ Successfully retrieved order ${query.id} from Medusa`)
          return NextResponse.json({
            success: true,
            order,
          })
        }

        console.warn(`❌ Order ${query.id} not found in any system`)
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )

      } catch (error) {
        console.error(`❌ Error fetching order ${query.id}:`, error)

        // Try fallback before failing
        try {
          const fallbackOrder = await orderService.getOrder(query.id)
          if (fallbackOrder) {
            console.log(`✅ Fallback successful for order ${query.id}`)
            return NextResponse.json({
              success: true,
              order: fallbackOrder,
            })
          }
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed for order ${query.id}:`, fallbackError)
        }

        return NextResponse.json(
          {
            error: 'Failed to retrieve order',
            message: error instanceof Error ? error.message : 'Unknown error',
            orderId: query.id
          },
          { status: 500 }
        )
      }
    }

    // Get orders by email
    if (query.email) {
      try {
        console.log(`🔍 Fetching orders for email: ${query.email}`)

        // Try new Medusa v2 service first
        let orders: Order[] = []

        try {
          orders = await medusaV2Service.getOrdersByEmail(query.email)
          console.log(`✅ Found ${orders.length} orders for ${query.email} via Medusa v2`)
        } catch (error) {
          console.warn(`⚠️ Medusa v2 failed for email ${query.email}, trying fallback:`, error)
          orders = await orderService.getOrdersByEmail(query.email)
          console.log(`✅ Found ${orders.length} orders for ${query.email} via fallback`)
        }

        // Apply status filter if provided
        const filteredOrders = query.status
          ? orders.filter(order => order.status === query.status)
          : orders

        // Apply pagination
        const paginatedOrders = filteredOrders.slice(
          query.offset,
          query.offset + query.limit
        )

        console.log(`✅ Returning ${paginatedOrders.length}/${filteredOrders.length} orders for ${query.email}`)

        return NextResponse.json({
          success: true,
          orders: paginatedOrders,
          total: filteredOrders.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < filteredOrders.length,
        })

      } catch (error) {
        console.error(`❌ Error fetching orders for email ${query.email}:`, error)
        return NextResponse.json(
          {
            error: 'Failed to retrieve orders',
            message: error instanceof Error ? error.message : 'Unknown error',
            email: query.email
          },
          { status: 500 }
        )
      }
    }

    // Return error if no filter provided
    return NextResponse.json(
      { error: 'Please provide either an order ID or email address' },
      { status: 400 }
    )

  } catch (error) {
    console.error('❌ Orders API validation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders
 * Create a new order
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validated = CreateOrderBodySchema.parse(body)

    // Add email to shipping if not provided
    if (!validated.shipping.email) {
      validated.shipping.email = validated.email
    }

    // Create order
    const order = await orderService.createOrder({
      email: validated.email,
      items: validated.items,
      shipping: {
        ...validated.shipping,
        email: validated.shipping.email || validated.email,
        lastName: validated.shipping.lastName || '',
        phone: validated.shipping.phone || '',
        country: validated.shipping.country || 'US',
      },
      paymentIntentId: validated.paymentIntentId,
      total: validated.total,
    })

    // Log order creation
    console.log(`📦 Order created successfully`)
    console.log(`   Order ID: ${order.id}`)
    console.log(`   Customer: ${order.email}`)
    console.log(`   Items: ${order.items.length}`)
    console.log(`   Total: $${(order.totals.total / 100).toFixed(2)}`)

    return NextResponse.json({
      success: true,
      order,
      message: 'Order created successfully',
    })
  } catch (error) {
    console.error('Error creating order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/orders
 * Update an existing order
 */
async function handlePUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validated = UpdateOrderBodySchema.parse(body)

    // Get existing order
    const existingOrder = await orderService.getOrder(validated.orderId)
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    let updatedOrder = existingOrder

    // Update status if provided
    if (validated.status) {
      updatedOrder = await orderService.updateOrderStatus(
        validated.orderId,
        validated.status
      ) || existingOrder
    }

    // Add tracking if provided
    if (validated.tracking) {
      updatedOrder = await orderService.addTracking(
        validated.orderId,
        validated.tracking
      ) || updatedOrder
    }

    // Add notes if provided
    if (validated.notes) {
      updatedOrder.notes = updatedOrder.notes || []
      updatedOrder.notes.push({
        text: validated.notes,
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: 'Order updated successfully',
    })
  } catch (error) {
    console.error('Error updating order:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/orders
 * Cancel an order
 */
async function handleDELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Update order status to cancelled
    const cancelledOrder = await orderService.updateOrderStatus(orderId, OrderStatus.CANCELLED)

    if (!cancelledOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      order: cancelledOrder,
      message: 'Order cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling order:', error)

    return NextResponse.json(
      { error: 'Failed to cancel order', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Export wrapped handlers with CORS
export const GET = withCors(handleGET)
export const POST = withCors(handlePOST)
export const PUT = withCors(handlePUT)
export const DELETE = withCors(handleDELETE)

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
    },
  })
}