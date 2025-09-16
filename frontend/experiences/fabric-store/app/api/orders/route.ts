/**
 * Orders API Route
 * Production-ready API endpoint for order management
 * Uses Medusa backend with fallback to local storage
 */

import { NextRequest, NextResponse } from 'next/server'
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
    name: z.string(),
    sku: z.string(),
    color: z.string(),
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
 * Retrieve orders by ID, email, or status
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

    // Get single order by ID
    if (query.id) {
      const order = await orderService.getOrder(query.id)

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        order,
      })
    }

    // Get orders by email
    if (query.email) {
      const orders = await orderService.getOrdersByEmail(query.email)

      // Apply status filter if provided
      const filteredOrders = query.status
        ? orders.filter(order => order.status === query.status)
        : orders

      // Apply pagination
      const paginatedOrders = filteredOrders.slice(
        query.offset,
        query.offset + query.limit
      )

      return NextResponse.json({
        success: true,
        orders: paginatedOrders,
        total: filteredOrders.length,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < filteredOrders.length,
      })
    }

    // Return error if no filter provided
    return NextResponse.json(
      { error: 'Please provide either an order ID or email address' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error fetching orders:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch orders', message: error instanceof Error ? error.message : 'Unknown error' },
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