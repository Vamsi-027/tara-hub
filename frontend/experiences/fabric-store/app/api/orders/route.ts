import { NextRequest, NextResponse } from 'next/server'
import { getOrderStorage } from '../../../lib/order-storage'
import { withCors } from '../../../lib/cors'

// Get persistent order storage
const orderStorage = getOrderStorage()

async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('id')
    const email = searchParams.get('email')
    const status = searchParams.get('status')
    
    // Get all orders or filter by criteria
    let filteredOrders = orderStorage.getAll()
    
    if (orderId) {
      const order = orderStorage.get(orderId)
      return NextResponse.json(order || null)
    }
    
    if (email) {
      filteredOrders = filteredOrders.filter(order => 
        order.email?.toLowerCase() === email.toLowerCase()
      )
    }
    
    if (status) {
      filteredOrders = filteredOrders.filter(order => 
        order.status === status
      )
    }
    
    // Sort by date (newest first)
    filteredOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    return NextResponse.json({
      orders: filteredOrders,
      total: filteredOrders.length,
      stats: orderStorage.getStats()
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      orderId, 
      email, 
      items, 
      shipping, 
      total, 
      paymentIntentId,
      status = 'pending' 
    } = body
    
    // Create order object
    const order = {
      id: orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      items: items || [],
      shipping: shipping || {},
      totals: {
        subtotal: items?.reduce((sum: number, item: any) => 
          sum + (item.price * item.quantity), 0) || 0,
        shipping: 1000, // $10 flat rate
        tax: 0,
        total: total || 0
      },
      paymentIntentId,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: [],
      timeline: [
        {
          status: 'created',
          timestamp: new Date().toISOString(),
          message: 'Order created'
        }
      ]
    }
    
    // Calculate tax
    order.totals.tax = Math.round(order.totals.subtotal * 0.08)
    if (!order.totals.total) {
      order.totals.total = order.totals.subtotal + order.totals.shipping + order.totals.tax
    }
    
    // Store order in file storage (backup)
    orderStorage.set(order.id, order)
    
    // Also store order in Medusa database using authentication-free endpoint
    try {
      const medusaResponse = await fetch('http://localhost:9000/fabric-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          email: order.email,
          items: order.items,
          shipping: order.shipping,
          totals: order.totals,
          paymentIntentId: order.paymentIntentId,
          status: order.status
        })
      })
      
      if (medusaResponse.ok) {
        const medusaData = await medusaResponse.json()
        console.log(`✅ Order stored in database: ${order.id}`)
        
        // Add database storage info to timeline
        order.timeline.push({
          status: 'database_stored',
          timestamp: new Date().toISOString(),
          message: 'Order stored in database'
        })
        
        // Update file storage with database confirmation
        orderStorage.set(order.id, order)
      } else {
        console.error('❌ Failed to store order in database, using file storage only')
        order.timeline.push({
          status: 'database_error',
          timestamp: new Date().toISOString(),
          message: 'Database storage failed, using file backup'
        })
        orderStorage.set(order.id, order)
      }
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError)
      order.timeline.push({
        status: 'database_error',
        timestamp: new Date().toISOString(),
        message: 'Database connection failed, using file backup'
      })
      orderStorage.set(order.id, order)
    }
    
    console.log(`📦 Order processed: ${order.id}`)
    console.log(`   Customer: ${order.email}`)
    console.log(`   Items: ${order.items.length}`)
    console.log(`   Total: $${(order.totals.total / 100).toFixed(2)}`)
    console.log(`   Storage: File ✅ ${order.timeline.some(t => t.status === 'database_stored') ? 'Database ✅' : 'Database ❌'}`)
    
    return NextResponse.json({
      success: true,
      order,
      storage: {
        file: true,
        database: order.timeline.some(t => t.status === 'database_stored')
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

async function handlePUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, notes, tracking } = body
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }
    
    const order = orderStorage.get(orderId)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Prepare updates
    const updates: any = {}
    
    if (status && status !== order.status) {
      updates.status = status
      if (!order.timeline) order.timeline = []
      order.timeline.push({
        status,
        timestamp: new Date().toISOString(),
        message: `Status changed to ${status}`
      })
    }
    
    if (notes) {
      if (!order.notes) order.notes = []
      order.notes.push({
        text: notes,
        timestamp: new Date().toISOString()
      })
    }
    
    if (tracking) {
      updates.tracking = tracking
      if (!order.timeline) order.timeline = []
      order.timeline.push({
        status: 'shipped',
        timestamp: new Date().toISOString(),
        message: `Tracking number added: ${tracking}`
      })
    }
    
    // Update order in storage
    const updatedOrder = orderStorage.update(orderId, { ...updates, timeline: order.timeline, notes: order.notes })
    
    return NextResponse.json({
      success: true,
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// Export wrapped handlers with CORS
export const GET = withCors(handleGET)
export const POST = withCors(handlePOST) 
export const PUT = withCors(handlePUT)

// Handle preflight OPTIONS requests
export async function OPTIONS(request: Request) {
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