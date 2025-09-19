import { defineMiddlewares } from "@medusajs/framework/http"
import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework"
import cors from "cors"

// Declare global type for fabric store data
declare global {
  var fabricStoreData: {
    orders: any[]
    customers: any[]
    stats: any
    lastSync: string
  } | undefined
}

// Helper function to transform a fabric order to Medusa format
function transformFabricOrder(order: any) {
  return {
    id: order.id,
    display_id: parseInt(order.id.split('_')[1]) || 9999,
    status: order.status || "pending",
    email: order.email,
    created_at: order.createdAt,
    updated_at: order.updatedAt || order.createdAt,
    canceled_at: order.status === "cancelled" ? order.createdAt : null,
    payment_status: order.status === "completed" ? "captured" : "awaiting",
    fulfillment_status: order.status === "completed" ? "fulfilled" : "not_fulfilled",
    total: order.totals?.total || 0,
    subtotal: order.totals?.subtotal || 0,
    tax_total: order.totals?.tax || 0,
    shipping_total: order.totals?.shipping || 0,
    discount_total: 0,
    discount_subtotal: 0,
    shipping_subtotal: order.totals?.shipping || 0,
    shipping_tax_total: 0,
    gift_card_total: 0,
    item_total: order.totals?.subtotal || 0,
    credit_line_total: 0,
    original_total: order.totals?.total || 0,
    refundable_total: order.totals?.total || 0,
    currency_code: "usd",
    summary: {
      transaction_total: order.totals?.total || 0,
      paid_total: order.status === "completed" ? order.totals?.total || 0 : 0,
      refunded_total: 0,
      pending_difference: order.status !== "completed" ? order.totals?.total || 0 : 0,
      captured_total: order.status === "completed" ? order.totals?.total || 0 : 0,
      authorized_total: order.status === "completed" ? order.totals?.total || 0 : 0,
      current_order_total: order.totals?.total || 0,
      original_order_total: order.totals?.total || 0
    },
    order_change: null,
    customer: {
      id: `cust_${order.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      email: order.email,
      first_name: order.shipping?.firstName,
      last_name: order.shipping?.lastName,
      phone: order.shipping?.phone,
      has_account: false
    },
    billing_address: order.shipping ? {
      id: `addr_bill_${order.id}`,
      first_name: order.shipping.firstName,
      last_name: order.shipping.lastName,
      address_1: order.shipping.address,
      city: order.shipping.city,
      province: order.shipping.state,
      postal_code: order.shipping.zipCode,
      country_code: "us",
      phone: order.shipping.phone
    } : null,
    shipping_address: order.shipping ? {
      id: `addr_ship_${order.id}`,
      first_name: order.shipping.firstName,
      last_name: order.shipping.lastName,
      address_1: order.shipping.address,
      city: order.shipping.city,
      province: order.shipping.state,
      postal_code: order.shipping.zipCode,
      country_code: "us",
      phone: order.shipping.phone
    } : null,
    region: {
      id: "reg_fabric",
      name: "United States",
      currency_code: "usd",
      tax_rate: 0
    },
    sales_channel: {
      name: "Fabric Store",
      id: "sc_fabric_store"
    },
    promotions: [],
    shipping_methods: [{
      id: `sm_${order.id}`,
      shipping_option: {
        name: "Standard Shipping",
        id: "so_standard"
      },
      price: order.totals?.shipping || 1000,
      data: {},
      tax_lines: []
    }],
    payment_collection: {
      id: `paycol_${order.id}`,
      currency_code: "usd",
      amount: order.totals?.total || 0,
      authorized_amount: order.status === "completed" ? order.totals?.total || 0 : null,
      captured_amount: order.status === "completed" ? order.totals?.total || 0 : 0,
      refunded_amount: 0,
      status: order.status === "completed" ? "authorized" : "pending",
      created_at: order.createdAt,
      updated_at: order.createdAt,
      payment_sessions: [{
        id: `paysess_${order.id}`,
        amount: order.totals?.total || 0,
        currency_code: "usd",
        provider_id: "stripe",
        status: order.status === "completed" ? "authorized" : "pending",
        data: {},
        created_at: order.createdAt
      }],
      payments: [{
        id: `pay_${order.id}`,
        amount: order.totals?.total || 0,
        currency_code: "usd",
        provider_id: "stripe",
        data: {
          payment_intent_id: order.paymentIntentId || `pi_${order.id}`
        },
        captured_at: order.status === "completed" ? order.createdAt : null,
        canceled_at: null,
        created_at: order.createdAt,
        updated_at: order.createdAt,
        refunds: []
      }]
    },
    payment_collections: [{
      id: `paycol_${order.id}`,
      currency_code: "usd",
      amount: order.totals?.total || 0,
      authorized_amount: order.status === "completed" ? order.totals?.total || 0 : null,
      captured_amount: order.status === "completed" ? order.totals?.total || 0 : 0,
      refunded_amount: 0,
      status: order.status === "completed" ? "authorized" : "pending",
      created_at: order.createdAt,
      updated_at: order.createdAt,
      payment_sessions: [{
        id: `paysess_${order.id}`,
        amount: order.totals?.total || 0,
        currency_code: "usd",
        provider_id: "stripe",
        status: order.status === "completed" ? "authorized" : "pending",
        data: {},
        created_at: order.createdAt
      }],
      payments: [{
        id: `pay_${order.id}`,
        amount: order.totals?.total || 0,
        currency_code: "usd",
        provider_id: "stripe",
        data: {
          payment_intent_id: order.paymentIntentId || `pi_${order.id}`
        },
        captured_at: order.status === "completed" ? order.createdAt : null,
        canceled_at: null,
        created_at: order.createdAt,
        updated_at: order.createdAt,
        refunds: []
      }]
    }],
    payments: [{
      id: `pay_${order.id}`,
      amount: order.totals?.total || 0,
      currency_code: "usd",
      provider_id: "stripe",
      payment_collection_id: `paycol_${order.id}`,
      cart_id: null,
      order_id: order.id,
      swap_id: null,
      customer_id: `cust_${order.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      data: {
        payment_intent_id: order.paymentIntentId || `pi_${order.id}`
      },
      captured_at: order.status === "completed" ? order.createdAt : null,
      canceled_at: order.status === "cancelled" ? order.createdAt : null,
      created_at: order.createdAt,
      updated_at: order.updatedAt || order.createdAt,
      refunds: []
    }],
    items: (order.items || []).map((item: any, index: number) => ({
      id: `item_${order.id}_${index}`,
      title: item.title,
      description: item.title,
      thumbnail: null,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
      total: item.price * item.quantity,
      original_total: item.price * item.quantity,
      original_tax_total: 0,
      tax_total: 0,
      discount_total: 0,
      raw_discount_total: 0,
      variant: {
        id: item.id,
        title: item.title,
        product_id: `prod_${item.id}`,
        product: {
          id: `prod_${item.id}`,
          title: item.title,
          thumbnail: null
        },
        sku: item.id,
        barcode: null,
        ean: null,
        upc: null,
        inventory_quantity: 100,
        manage_inventory: false,
        hs_code: null,
        origin_country: null,
        mid_code: null,
        material: "fabric",
        weight: null,
        length: null,
        height: null,
        width: null
      },
      tax_lines: [],
      adjustments: [],
      refundable: item.price * item.quantity,
      fulfilled_quantity: order.status === "completed" ? item.quantity : 0,
      returned_quantity: 0,
      shipped_quantity: order.status === "completed" ? item.quantity : 0
    })),
    refunds: [],
    credit_lines: [],
    fulfillments: order.status === "completed" ? [{
      id: `ful_${order.id}`,
      items: (order.items || []).map((item: any, index: number) => ({
        item_id: `item_${order.id}_${index}`,
        quantity: item.quantity
      })),
      shipped_at: order.updatedAt || order.createdAt,
      created_at: order.createdAt
    }] : [],
    returns: [],
    claims: [],
    swaps: [],
    draft_order_id: null,
    no_notification: false,
    activities: [
      {
        id: `act_created_${order.id}`,
        type: "created",
        title: "Order Created",
        description: "Order was created",
        created_at: order.createdAt,
        metadata: {}
      },
      order.status === "completed" ? {
        id: `act_payment_${order.id}`,
        type: "payment_captured",
        title: "Payment Captured",
        description: `Payment of $${((order.totals?.total || 0) / 100).toFixed(2)} was captured`,
        created_at: order.createdAt,
        metadata: {}
      } : null,
      order.status === "completed" ? {
        id: `act_fulfilled_${order.id}`,
        type: "fulfilled",
        title: "Order Fulfilled",
        description: "All items have been fulfilled",
        created_at: order.updatedAt || order.createdAt,
        metadata: {}
      } : null
    ].filter(Boolean),
    notes: order.notes || [],
    metadata: {
      source: "fabric-store",
      original_id: order.id
    }
  }
}

// Middleware to inject fabric orders into Medusa orders response
async function injectFabricOrders(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Check if this is a single order request
  const pathSegments = req.path.split('/')
  const isOrderDetailRequest = pathSegments.includes('orders') && pathSegments.length > 3
  const orderId = isOrderDetailRequest ? pathSegments[pathSegments.length - 1] : null
  
  // If it's a request for a specific fabric order
  if (orderId?.startsWith('order_')) {
    try {
      const fabricOrders = global.fabricStoreData?.orders || []
      const fabricOrder = fabricOrders.find((o: any) => o.id === orderId)
      
      if (fabricOrder) {
        // Return the fabric order directly (already in correct format)
        return res.json({
          order: fabricOrder
        })
      }
    } catch (error) {
      console.error('Error fetching single fabric order:', error)
    }
  }
  
  // Store original json method
  const originalJson = res.json.bind(res)
  
  // Override json method to inject fabric data
  res.json = function(data: any) {
    // Check if this is an orders list response
    if (data && data.orders && Array.isArray(data.orders)) {
      // Get fabric orders from global store
      const fabricOrders = global.fabricStoreData?.orders || []
      
      // The fabric orders are already in the correct format from our API
      // So we just need to merge them without transformation
      data.orders = [...fabricOrders, ...data.orders]
      data.count = (data.count || 0) + fabricOrders.length
      
      console.log(`Injected ${fabricOrders.length} fabric orders`)
    }
    
    return originalJson(data)
  }
  
  next()
}

// Helper function to transform fabric customer with orders
function transformFabricCustomer(customer: any, includeOrders: boolean = false) {
  const transformed: any = {
    id: customer.id,
    email: customer.email,
    first_name: customer.firstName || customer.name?.split(' ')[0] || '',
    last_name: customer.lastName || customer.name?.split(' ')[1] || '',
    phone: customer.phone,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt || customer.createdAt,
    has_account: true,
    groups: [],
    addresses: customer.address ? [{
      id: `addr_${customer.id}`,
      first_name: customer.firstName || '',
      last_name: customer.lastName || '',
      address_1: customer.address.address || '',
      city: customer.address.city || '',
      province: customer.address.state || '',
      postal_code: customer.address.zipCode || '',
      country_code: customer.address.country?.toLowerCase() || 'us',
      phone: customer.phone || ''
    }] : [],
    // Add metadata to identify fabric customers
    metadata: {
      source: "fabric-store",
      total_orders: customer.totalOrders || 0,
      total_spent: customer.totalSpent || 0,
      last_order_date: customer.lastOrderDate,
      average_order_value: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0
    }
  }
  
  // Include orders if requested (for detail view)
  if (includeOrders) {
    const fabricOrders = global.fabricStoreData?.orders || []
    const customerOrders = fabricOrders.filter((order: any) => order.email === customer.email)
    transformed.orders = customerOrders.map((order: any) => transformFabricOrder(order))
  }
  
  return transformed
}

// Middleware to inject fabric customers into Medusa customers response
async function injectFabricCustomers(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Check if this is a single customer request
  const pathSegments = req.path.split('/')
  const isCustomerDetailRequest = pathSegments.includes('customers') && pathSegments.length > 3
  const customerId = isCustomerDetailRequest ? pathSegments[pathSegments.length - 1] : null
  
  // If it's a request for a specific fabric customer
  if (customerId?.startsWith('cust_')) {
    try {
      const fabricCustomers = global.fabricStoreData?.customers || []
      const fabricCustomer = fabricCustomers.find((c: any) => c.id === customerId)
      
      if (fabricCustomer) {
        // Return the fabric customer directly with orders
        return res.json({
          customer: transformFabricCustomer(fabricCustomer, true)
        })
      }
    } catch (error) {
      console.error('Error fetching single fabric customer:', error)
    }
  }
  
  // Store original json method
  const originalJson = res.json.bind(res)
  
  // Override json method to inject fabric data
  res.json = function(data: any) {
    // Check if this is a customers response
    if (data && data.customers && Array.isArray(data.customers)) {
      // Get fabric customers from global store
      const fabricCustomers = global.fabricStoreData?.customers || []
      
      // Transform fabric customers to match Medusa format
      const transformedFabricCustomers = fabricCustomers.map((customer: any) => 
        transformFabricCustomer(customer, false)
      )
      
      // Merge fabric customers with existing customers
      data.customers = [...transformedFabricCustomers, ...data.customers]
      data.count = (data.count || 0) + transformedFabricCustomers.length
      
      console.log(`Injected ${transformedFabricCustomers.length} fabric customers`)
    }
    
    // Check if this is a single customer response with orders
    if (data && data.customer && !Array.isArray(data.customer)) {
      // If it's a fabric customer, add their orders
      if (data.customer.metadata?.source === "fabric-store") {
        const fabricOrders = global.fabricStoreData?.orders || []
        const customerOrders = fabricOrders.filter((order: any) => 
          order.email === data.customer.email
        )
        data.customer.orders = customerOrders.map((order: any) => transformFabricOrder(order))
      }
    }
    
    return originalJson(data)
  }
  
  next()
}

// Middleware to check authentication for admin routes
async function checkAdminAuth(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Skip auth check for auth endpoints, login page, and public assets
  if (
    req.path.startsWith("/auth/") ||
    req.path.startsWith("/admin/auth/") ||
    req.path === "/app/login" ||
    req.path.includes(".js") ||
    req.path.includes(".css") ||
    req.path.includes(".map") ||
    req.path.includes(".ttf") ||
    req.path.includes(".woff")
  ) {
    return next()
  }

  // For Medusa v2, check if there's a user in the request
  // The auth module sets req.auth_context when authenticated
  const authContext = req.auth_context
  const actorId = authContext?.actor_id // This is the user email in Medusa v2
  
  // Whitelist of allowed admin email addresses
  const ALLOWED_ADMIN_EMAILS = [
    "varaku@gmail.com",
    "vamsicheruku027@gmail.com", 
    "admin@deepcrm.ai",
    "batchu.kedareswaraabhinav@gmail.com",
    "admin@tara-hub.com"
  ]

  // Check if user is authenticated and in whitelist
  if (!actorId || !ALLOWED_ADMIN_EMAILS.includes(actorId)) {
    // For app routes, let Medusa handle the authentication
    if (req.path.startsWith("/app")) {
      // Let it pass through so Medusa can handle authentication
      return next()
    }
    // For API routes that require auth, check properly
    if (req.path.startsWith("/admin/")) {
      // If no auth context, user is not authenticated
      if (!authContext) {
        return res.status(401).json({
          error: "Authentication required."
        })
      }
      // If authenticated but not in whitelist
      if (actorId && !ALLOWED_ADMIN_EMAILS.includes(actorId)) {
        return res.status(403).json({
          error: "Access denied. Your email is not authorized for admin access."
        })
      }
    }
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/submit-contact",
      middlewares: [
        cors({
          origin: ["http://localhost:3006", "http://localhost:3000", "https://tara-hub.vercel.app"],
          credentials: true,
          methods: ["POST", "OPTIONS"],
          allowedHeaders: ["Content-Type"],
        })
      ] // Allow contact form submissions without API key
    },
    {
      matcher: "/admin/auth*",
      middlewares: [] // No auth check for auth routes
    },
    {
      matcher: "/admin/uploads*",
      middlewares: [
        cors({
          origin: ["http://localhost:9000", "http://localhost:3000", "http://localhost:7001"],
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization", "x-medusa-access-token"],
        })
      ]
    },
    {
      matcher: "/admin/orders*",
      middlewares: [injectFabricOrders]
    },
    {
      matcher: "/admin/customers*",
      middlewares: [injectFabricCustomers]
    }
  ]
})