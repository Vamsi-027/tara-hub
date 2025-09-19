/**
 * Fabric Store Integration Utilities
 *
 * These utilities handle the integration of fabric store data
 * with Medusa's data structures. They are preserved during the
 * checkout removal as they're needed for order management.
 */

import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"

/**
 * Transform a fabric store order to Medusa format
 * This is used for displaying historical orders from the fabric store
 */
export function transformFabricOrder(order: any): any {
  // Calculate totals
  const subtotal = order.items?.reduce((sum: number, item: any) =>
    sum + (item.unit_price * item.quantity), 0) || 0
  const taxRate = order.tax_total && subtotal > 0 ? order.tax_total / subtotal : 0.0875 // Default 8.75% tax

  return {
    // Core order fields
    id: order.id || `order_${Date.now()}`,
    display_id: order.display_id || order.orderNumber || parseInt(order.id?.replace('order_', '') || '0'),
    email: order.email || order.customer_email,
    currency_code: order.currency_code || 'usd',

    // Status fields
    status: order.status || 'completed',
    fulfillment_status: order.fulfillment_status || 'not_fulfilled',
    payment_status: order.payment_status || 'captured',

    // Financial fields
    total: order.total || subtotal * (1 + taxRate),
    subtotal: order.subtotal || subtotal,
    tax_total: order.tax_total || Math.round(subtotal * taxRate),
    discount_total: order.discount_total || 0,
    shipping_total: order.shipping_total || 0,
    gift_card_total: order.gift_card_total || 0,
    gift_card_tax_total: order.gift_card_tax_total || 0,
    refunded_total: order.refunded_total || 0,

    // Items
    items: order.items?.map((item: any) => ({
      id: item.id || `item_${Date.now()}_${Math.random()}`,
      order_id: order.id,
      title: item.title || item.product_title || item.name,
      description: item.description || null,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || item.price || 0,
      variant_id: item.variant_id || null,
      product_id: item.product_id || null,
      thumbnail: item.thumbnail || null,
      variant: item.variant || null,
      metadata: item.metadata || {},
      tax_total: Math.round((item.unit_price * item.quantity) * taxRate),
      total: Math.round(item.unit_price * item.quantity * (1 + taxRate)),
      subtotal: item.unit_price * item.quantity
    })) || [],

    // Addresses
    shipping_address: order.shipping_address || {
      first_name: order.shipping_first_name || '',
      last_name: order.shipping_last_name || '',
      address_1: order.shipping_address_1 || '',
      address_2: order.shipping_address_2 || '',
      city: order.shipping_city || '',
      province: order.shipping_province || '',
      postal_code: order.shipping_postal_code || '',
      country_code: order.shipping_country_code || 'us'
    },

    billing_address: order.billing_address || order.shipping_address || null,

    // Customer
    customer: order.customer || {
      id: order.customer_id || `cust_${order.email}`,
      email: order.email,
      first_name: order.first_name || order.email?.split('@')[0],
      last_name: order.last_name || ''
    },

    customer_id: order.customer_id || order.customer?.id,

    // Timestamps
    created_at: order.created_at || order.createdAt || new Date().toISOString(),
    updated_at: order.updated_at || order.updatedAt || new Date().toISOString(),

    // Additional fields
    region_id: order.region_id || 'reg_01',
    sales_channel_id: order.sales_channel_id || null,
    shipping_methods: order.shipping_methods || [],
    payments: order.payments || [],
    fulfillments: order.fulfillments || [],
    returns: order.returns || [],
    claims: order.claims || [],
    swaps: order.swaps || [],
    draft_order_id: order.draft_order_id || null,

    metadata: {
      ...order.metadata,
      source: 'fabric-store',
      original_id: order.id
    }
  }
}

/**
 * Transform a fabric store customer to Medusa format
 */
export function transformFabricCustomer(customer: any, includeOrders: boolean = false): any {
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

/**
 * Middleware to inject fabric orders into Medusa orders response
 * This is preserved as it's needed for order management
 */
export async function injectFabricOrders(
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

/**
 * Middleware to inject fabric customers into Medusa customers response
 * This is preserved as it's needed for customer management
 */
export async function injectFabricCustomers(
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

    return originalJson(data)
  }

  next()
}