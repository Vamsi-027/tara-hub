/**
 * Fabric Orders API - Production Ready
 * Uses Medusa's built-in order service for proper order management
 */

interface MedusaRequest {
  scope: any
  body: any
  query: any
}

interface MedusaResponse {
  status: (code: number) => { json: (data: any) => any }
}

interface CreateOrderRequest {
  orderId?: string
  email: string
  items: Array<{
    id: string
    name: string
    sku: string
    color: string
    price: number
    quantity: number
    image?: string
  }>
  shipping: {
    firstName: string
    lastName?: string
    email?: string
    phone?: string
    address: string
    city: string
    state: string
    zipCode: string
    country?: string
  }
  totals: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  total: number
  paymentIntentId?: string
  status?: string
}

interface GetOrdersQuery {
  email?: string
  limit?: string
  offset?: string
  status?: string
}

/**
 * POST /store/fabric-orders
 * Create a new order using Medusa's order service
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const data = req.body as CreateOrderRequest
    const { email, items, shipping, totals, paymentIntentId, status = 'pending' } = data

    console.log(`🎯 Creating fabric order for ${email}`)

    // Get order service
    const orderService = req.scope.resolve("orderService")
    const customerService = req.scope.resolve("customerService")
    const regionService = req.scope.resolve("regionService")

    // Get or create customer
    let customer
    try {
      customer = await customerService.retrieveByEmail(email)
    } catch (error) {
      // Customer doesn't exist, create one
      customer = await customerService.create({
        email,
        first_name: shipping.firstName,
        last_name: shipping.lastName || '',
        phone: shipping.phone
      })
      console.log(`👤 Created new customer: ${customer.id}`)
    }

    // Get default region (US)
    const regions = await regionService.list()
    const region = regions.find(r => r.currency_code === 'usd') || regions[0]

    if (!region) {
      throw new Error('No region found')
    }

    // Create order data
    const orderData = {
      customer_id: customer.id,
      email: email,
      region_id: region.id,
      currency_code: 'usd',

      // Shipping address
      shipping_address: {
        first_name: shipping.firstName,
        last_name: shipping.lastName || '',
        phone: shipping.phone || '',
        address_1: shipping.address,
        city: shipping.city,
        province: shipping.state,
        postal_code: shipping.zipCode,
        country_code: (shipping.country || 'US').toLowerCase()
      },

      // Billing address (same as shipping)
      billing_address: {
        first_name: shipping.firstName,
        last_name: shipping.lastName || '',
        phone: shipping.phone || '',
        address_1: shipping.address,
        city: shipping.city,
        province: shipping.state,
        postal_code: shipping.zipCode,
        country_code: (shipping.country || 'US').toLowerCase()
      },

      // Order items - convert to Medusa format
      items: items.map(item => ({
        title: item.name,
        description: `${item.name} - ${item.color}`,
        thumbnail: item.image,
        unit_price: item.price,
        quantity: item.quantity,
        variant: {
          title: item.color,
          sku: item.sku,
          inventory_quantity: 100
        },
        metadata: {
          fabric_item_id: item.id,
          color: item.color,
          sku: item.sku
        }
      })),

      // Order totals
      subtotal: totals.subtotal,
      tax_total: totals.tax,
      shipping_total: totals.shipping,
      total: totals.total,

      // Payment and fulfillment status
      payment_status: paymentIntentId ? 'captured' : 'awaiting',
      fulfillment_status: 'not_fulfilled',
      status: status,

      // Metadata
      metadata: {
        source: 'fabric-store',
        payment_intent_id: paymentIntentId,
        original_order_id: data.orderId
      }
    }

    // Create the order
    const order = await orderService.create(orderData)

    console.log(`✅ Order created successfully: ${order.id}`)
    console.log(`📧 Customer: ${email}`)
    console.log(`💰 Total: $${(order.total / 100).toFixed(2)}`)

    return res.status(200).json({
      success: true,
      order: {
        id: order.id,
        email: order.email,
        status: order.status,
        total: order.total,
        created_at: order.created_at,
        medusa_visible: true,
        admin_url: `/admin/orders/${order.id}`
      },
      message: "Order created and visible in Medusa Admin"
    })

  } catch (error) {
    console.error('❌ Error creating fabric order:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

/**
 * GET /store/fabric-orders
 * Retrieve orders by email
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.query as GetOrdersQuery
    const { email, limit = "50", offset = "0", status } = query

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email parameter is required"
      })
    }

    console.log(`📋 Retrieving orders for: ${email}`)

    // Get order service
    const orderService = req.scope.resolve("orderService")

    // Build filter
    const filters: any = { email: email }
    if (status) {
      filters.status = status
    }

    // Get orders
    const orders = await orderService.list(filters, {
      relations: ["items", "shipping_address", "billing_address", "customer"],
      take: parseInt(limit),
      skip: parseInt(offset),
      order: { created_at: "DESC" }
    })

    console.log(`📊 Retrieved ${orders.length} orders from Medusa`)

    // Transform to our format
    const transformedOrders = orders.map(order => ({
      id: order.id,
      email: order.email,
      status: order.status,
      items: order.items?.map(item => ({
        id: item.metadata?.fabric_item_id || item.id,
        name: item.title,
        sku: item.metadata?.sku || '',
        color: item.metadata?.color || item.variant?.title || '',
        price: item.unit_price,
        quantity: item.quantity,
        image: item.thumbnail
      })) || [],
      shipping: {
        firstName: order.shipping_address?.first_name || '',
        lastName: order.shipping_address?.last_name || '',
        email: order.email,
        phone: order.shipping_address?.phone || '',
        address: order.shipping_address?.address_1 || '',
        city: order.shipping_address?.city || '',
        state: order.shipping_address?.province || '',
        zipCode: order.shipping_address?.postal_code || '',
        country: order.shipping_address?.country_code?.toUpperCase() || 'US'
      },
      totals: {
        subtotal: order.subtotal || 0,
        shipping: order.shipping_total || 0,
        tax: order.tax_total || 0,
        total: order.total || 0
      },
      paymentIntentId: order.metadata?.payment_intent_id,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }))

    return res.status(200).json({
      success: true,
      orders: transformedOrders,
      count: transformedOrders.length,
      source: "medusa"
    })

  } catch (error) {
    console.error('❌ Error retrieving orders:', error)

    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve orders',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}