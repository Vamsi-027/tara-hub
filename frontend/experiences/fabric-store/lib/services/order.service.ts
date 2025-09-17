/**
 * Order Service
 * Production-ready service for managing orders with Medusa backend
 * Includes error handling, retry logic, and fallback mechanisms
 */

import { z } from 'zod'

// Order validation schemas
const OrderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  color: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  image: z.string().optional(),
})

const ShippingAddressSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional().default(''),
  email: z.string().email(),
  phone: z.string().optional().default(''),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().default('US'),
})

const CreateOrderSchema = z.object({
  email: z.string().email(),
  items: z.array(OrderItemSchema).min(1),
  shipping: ShippingAddressSchema,
  paymentIntentId: z.string().optional(),
  total: z.number().min(0),
})

export type OrderItem = z.infer<typeof OrderItemSchema>
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export interface Order {
  id: string
  email: string
  items: OrderItem[]
  shipping: ShippingAddress
  totals: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  status: OrderStatus
  paymentIntentId?: string
  tracking?: string
  createdAt: string
  updatedAt: string
  timeline?: OrderEvent[]
  notes?: OrderNote[]
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export interface OrderEvent {
  status: string
  timestamp: string
  message: string
  metadata?: Record<string, any>
}

export interface OrderNote {
  text: string
  timestamp: string
  author?: string
}

/**
 * Order Service Configuration
 */
class OrderServiceConfig {
  private static instance: OrderServiceConfig

  public medusaUrl: string
  public publishableKey: string
  public maxRetries: number = 3
  public retryDelay: number = 1000
  public timeout: number = 60000
  public useFallback: boolean = true

  private constructor() {
    this.medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                     process.env.MEDUSA_BACKEND_URL ||
                     'http://localhost:9000'
    this.publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

    console.log('🔧 OrderService configured:', {
      medusaUrl: this.medusaUrl,
      publishableKey: this.publishableKey ? `${this.publishableKey.substring(0, 20)}...` : 'NOT SET'
    })
  }

  public static getInstance(): OrderServiceConfig {
    if (!OrderServiceConfig.instance) {
      OrderServiceConfig.instance = new OrderServiceConfig()
    }
    return OrderServiceConfig.instance
  }
}

/**
 * Order Service
 */
export class OrderService {
  private config: OrderServiceConfig
  private fallbackStorage: Map<string, Order> = new Map()

  constructor() {
    this.config = OrderServiceConfig.getInstance()
    this.loadFallbackStorage()
  }

  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    // Validate input
    const validated = CreateOrderSchema.parse(input)

    // Generate order ID
    const orderId = this.generateOrderId()

    // Calculate totals
    const totals = this.calculateTotals(validated.items)

    // Create order object
    const order: Order = {
      id: orderId,
      email: validated.email,
      items: validated.items,
      shipping: validated.shipping,
      totals,
      status: OrderStatus.PENDING,
      paymentIntentId: validated.paymentIntentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{
        status: 'created',
        timestamp: new Date().toISOString(),
        message: 'Order created',
      }],
    }

    try {
      // Try to create order in Medusa
      const medusaOrder = await this.createMedusaOrder(order)
      if (medusaOrder) {
        return medusaOrder
      }
    } catch (error) {
      console.error('Failed to create order in Medusa:', error)
      if (!this.config.useFallback) {
        throw error
      }
    }

    // Fallback to local storage
    return this.saveFallbackOrder(order)
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order | null> {
    try {
      // Try to get from Medusa
      const medusaOrder = await this.getMedusaOrder(orderId)
      if (medusaOrder) {
        return medusaOrder
      }
    } catch (error) {
      console.error('Failed to get order from Medusa:', error)
    }

    // Fallback to local storage
    return this.fallbackStorage.get(orderId) || null
  }

  /**
   * Get orders by customer email
   */
  async getOrdersByEmail(email: string): Promise<Order[]> {
    try {
      // Try to get from Medusa
      const medusaOrders = await this.getMedusaOrdersByEmail(email)
      if (medusaOrders && medusaOrders.length > 0) {
        return medusaOrders
      }
    } catch (error) {
      console.error('Failed to get orders from Medusa:', error)
    }

    // Fallback to local storage
    const fallbackOrders = Array.from(this.fallbackStorage.values())
      .filter(order => order.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return fallbackOrders
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, metadata?: Record<string, any>): Promise<Order | null> {
    try {
      // Try to update in Medusa
      const medusaOrder = await this.updateMedusaOrder(orderId, { status })
      if (medusaOrder) {
        return medusaOrder
      }
    } catch (error) {
      console.error('Failed to update order in Medusa:', error)
    }

    // Fallback to local storage
    const order = this.fallbackStorage.get(orderId)
    if (order) {
      order.status = status
      order.updatedAt = new Date().toISOString()
      order.timeline?.push({
        status,
        timestamp: new Date().toISOString(),
        message: `Status updated to ${status}`,
        metadata,
      })
      this.saveFallbackOrder(order)
      return order
    }

    return null
  }

  /**
   * Add tracking number to order
   */
  async addTracking(orderId: string, trackingNumber: string): Promise<Order | null> {
    const order = await this.getOrder(orderId)
    if (!order) return null

    order.tracking = trackingNumber
    order.status = OrderStatus.SHIPPED
    order.updatedAt = new Date().toISOString()
    order.timeline?.push({
      status: 'shipped',
      timestamp: new Date().toISOString(),
      message: `Tracking number added: ${trackingNumber}`,
    })

    return this.saveFallbackOrder(order)
  }

  /**
   * Private: Map frontend product IDs to Medusa variant IDs
   */
  private async mapToMedusaVariants(items: OrderItem[]): Promise<OrderItem[]> {
    const mappedItems: OrderItem[] = []

    for (const item of items) {
      // Try to map common frontend IDs to actual Medusa variant IDs
      let variantId = item.id

      // Known product mappings (you can expand this based on your catalog)
      const productMappings: Record<string, string> = {
        'fabric-001': 'variant_01K51VADRT5G8KNKP7HWFEY235', // Sandwell Lipstick - Fabric Per Yard
        'fabric-002': 'variant_01K57QA138A2MKQQNR667AM9XC', // Jefferson Linen Sunglow - Fabric Per Yard
        'swatch-001': 'variant_01K51VADRSDBEJTCXV0GTPZ484', // Sandwell Lipstick - Swatch Sample
        'swatch-002': 'variant_01K57QA137DXZZN3FZS20X7EAQ', // Jefferson Linen Sunglow - Swatch Sample
      }

      // Check if we have a mapping for this product ID
      if (productMappings[item.id]) {
        variantId = productMappings[item.id]
        console.log(`🛒 [MEDUSA ORDER] 🔄 Mapped ${item.id} → ${variantId}`)
      } else {
        // If the ID already looks like a Medusa variant ID, use it as-is
        if (item.id.startsWith('variant_')) {
          variantId = item.id
        } else {
          console.log(`🛒 [MEDUSA ORDER] ⚠️ No mapping found for product ID: ${item.id}, using as-is`)
        }
      }

      mappedItems.push({
        ...item,
        id: variantId
      })
    }

    return mappedItems
  }

  /**
   * Private: Create order in Medusa backend using proper cart/checkout flow
   */
  private async createMedusaOrder(order: Order): Promise<Order | null> {
    try {
      console.log('🛒 [MEDUSA ORDER] Starting cart/checkout flow...')
      console.log('🛒 [MEDUSA ORDER] Order data:', {
        id: order.id,
        email: order.email,
        itemCount: order.items.length,
        total: order.totals.total,
        shipping: {
          country: order.shipping.country,
          state: order.shipping.state,
          city: order.shipping.city
        }
      })
      console.log('🛒 [MEDUSA ORDER] Original Items:', order.items.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price
      })))

      // Map frontend product IDs to Medusa variant IDs
      const mappedItems = await this.mapToMedusaVariants(order.items)
      console.log('🛒 [MEDUSA ORDER] Mapped Items:', mappedItems.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })))

      // Step 0: Get available regions
      console.log('🛒 [MEDUSA ORDER] Step 0: Fetching regions...')
      const regionsResponse = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/regions`,
        {
          headers: {
            'x-publishable-api-key': this.config.publishableKey,
          },
        }
      )

      if (!regionsResponse.ok) {
        console.error('🛒 [MEDUSA ORDER] ❌ Failed to fetch regions:', regionsResponse.status)
        const errorText = await regionsResponse.text()
        console.error('🛒 [MEDUSA ORDER] ❌ Regions error details:', errorText)
        return null
      }

      const { regions } = await regionsResponse.json()
      console.log('🛒 [MEDUSA ORDER] ✅ Available regions:', regions?.length || 0)
      if (!regions || regions.length === 0) {
        console.error('🛒 [MEDUSA ORDER] ❌ No regions available')
        return null
      }

      // Use the first available region (or find by country)
      let region = regions.find((r: any) =>
        r.countries?.some((c: any) => c.iso_2.toLowerCase() === order.shipping.country.toLowerCase())
      )

      // If no region found for the country, use the first available region
      if (!region) {
        region = regions[0]
        console.log('🛒 [MEDUSA ORDER] ⚠️ No region found for country:', order.shipping.country, 'using default region:', region.name)
      }

      console.log('🛒 [MEDUSA ORDER] ✅ Using region:', {
        id: region.id,
        name: region.name,
        currency: region.currency_code,
        matchedCountry: order.shipping.country
      })

      // Step 1: Create a cart
      console.log('🛒 [MEDUSA ORDER] Step 1: Creating cart...')
      const cartPayload = {
        email: order.email,
        region_id: region.id,
      }
      console.log('🛒 [MEDUSA ORDER] Cart payload:', cartPayload)

      const cartResponse = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/carts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': this.config.publishableKey,
          },
          body: JSON.stringify(cartPayload),
        }
      )

      if (!cartResponse.ok) {
        console.error('🛒 [MEDUSA ORDER] ❌ Failed to create cart:', cartResponse.status)
        const errorText = await cartResponse.text()
        console.error('🛒 [MEDUSA ORDER] ❌ Cart creation error details:', errorText)
        return null
      }

      const cartResponseData = await cartResponse.json()
      const { cart } = cartResponseData
      console.log('🛒 [MEDUSA ORDER] ✅ Cart created successfully:', {
        id: cart.id,
        email: cart.email,
        region_id: cart.region_id,
        currency: cart.currency_code
      })

      // Step 2: Add items to cart
      console.log('🛒 [MEDUSA ORDER] Step 2: Adding items to cart...')
      console.log('🛒 [MEDUSA ORDER] Processing', mappedItems.length, 'items')

      for (let i = 0; i < mappedItems.length; i++) {
        const item = mappedItems[i]
        console.log(`🛒 [MEDUSA ORDER] Adding item ${i + 1}/${mappedItems.length}:`, {
          id: item.id,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price
        })

        const itemPayload = {
          variant_id: item.id, // Assuming item.id is the variant ID
          quantity: item.quantity,
        }
        console.log(`🛒 [MEDUSA ORDER] Item payload:`, itemPayload)

        const addItemResponse = await this.fetchWithRetry(
          `${this.config.medusaUrl}/store/carts/${cart.id}/line-items`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-publishable-api-key': this.config.publishableKey,
            },
            body: JSON.stringify(itemPayload),
          }
        )

        if (!addItemResponse.ok) {
          console.error(`🛒 [MEDUSA ORDER] ❌ Failed to add item ${item.id} to cart:`, addItemResponse.status)
          const errorText = await addItemResponse.text()
          console.error(`🛒 [MEDUSA ORDER] ❌ Item addition error details:`, errorText)
          return null
        }

        const addItemResponseData = await addItemResponse.json()
        console.log(`🛒 [MEDUSA ORDER] ✅ Item ${i + 1} added successfully`)
      }

      console.log('🛒 [MEDUSA ORDER] ✅ All items added to cart successfully')

      // Step 3: Add shipping address
      console.log('🛒 [MEDUSA ORDER] Step 3: Adding shipping address...')
      const addressPayload = {
        shipping_address: {
          first_name: order.shipping.firstName,
          last_name: order.shipping.lastName,
          address_1: order.shipping.address,
          city: order.shipping.city,
          province: order.shipping.state,
          postal_code: order.shipping.zipCode,
          country_code: order.shipping.country.toLowerCase(),
          phone: order.shipping.phone,
        },
        billing_address: {
          first_name: order.shipping.firstName,
          last_name: order.shipping.lastName,
          address_1: order.shipping.address,
          city: order.shipping.city,
          province: order.shipping.state,
          postal_code: order.shipping.zipCode,
          country_code: order.shipping.country.toLowerCase(),
          phone: order.shipping.phone,
        },
        email: order.email,
      }
      console.log('🛒 [MEDUSA ORDER] Address payload:', addressPayload)

      const shippingResponse = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/carts/${cart.id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': this.config.publishableKey,
          },
          body: JSON.stringify(addressPayload),
        }
      )

      if (!shippingResponse.ok) {
        console.error('🛒 [MEDUSA ORDER] ❌ Failed to add shipping address:', shippingResponse.status)
        const errorText = await shippingResponse.text()
        console.error('🛒 [MEDUSA ORDER] ❌ Shipping address error details:', errorText)
        return null
      }

      const shippingResponseData = await shippingResponse.json()
      console.log('🛒 [MEDUSA ORDER] ✅ Shipping address added successfully')

      // Step 4: Add shipping methods (get available first)
      console.log('🛒 [MEDUSA ORDER] Step 4: Adding shipping methods...')
      const shippingOptionsResponse = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/shipping-options/${cart.id}`,
        {
          headers: {
            'x-publishable-api-key': this.config.publishableKey,
          },
        }
      )

      if (shippingOptionsResponse.ok) {
        const { shipping_options } = await shippingOptionsResponse.json()
        console.log('🛒 [MEDUSA ORDER] Available shipping options:', shipping_options?.length || 0)

        if (shipping_options.length > 0) {
          console.log('🛒 [MEDUSA ORDER] Using shipping option:', {
            id: shipping_options[0].id,
            name: shipping_options[0].name,
            price: shipping_options[0].price_incl_tax
          })

          const shippingMethodPayload = {
            option_id: shipping_options[0].id,
          }

          const shippingMethodResponse = await this.fetchWithRetry(
            `${this.config.medusaUrl}/store/carts/${cart.id}/shipping-methods`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-publishable-api-key': this.config.publishableKey,
              },
              body: JSON.stringify(shippingMethodPayload),
            }
          )

          if (shippingMethodResponse.ok) {
            console.log('🛒 [MEDUSA ORDER] ✅ Shipping method added successfully')
          } else {
            console.error('🛒 [MEDUSA ORDER] ❌ Failed to add shipping method:', shippingMethodResponse.status)
            const errorText = await shippingMethodResponse.text()
            console.error('🛒 [MEDUSA ORDER] ❌ Shipping method error details:', errorText)
          }
        } else {
          console.log('🛒 [MEDUSA ORDER] ⚠️ No shipping options available, continuing without shipping method')
        }
      } else {
        console.error('🛒 [MEDUSA ORDER] ❌ Failed to fetch shipping options:', shippingOptionsResponse.status)
        const errorText = await shippingOptionsResponse.text()
        console.error('🛒 [MEDUSA ORDER] ❌ Shipping options error details:', errorText)
      }

      // Step 5: Complete the cart to create order
      console.log('🛒 [MEDUSA ORDER] Step 5: Completing cart to create order...')
      const completeResponse = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/carts/${cart.id}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': this.config.publishableKey,
          },
        }
      )

      if (!completeResponse.ok) {
        console.error('🛒 [MEDUSA ORDER] ❌ Failed to complete cart:', completeResponse.status)
        const errorText = await completeResponse.text()
        console.error('🛒 [MEDUSA ORDER] ❌ Cart completion error details:', errorText)
        return null
      }

      const completeResponseData = await completeResponse.json()
      const { order: medusaOrder } = completeResponseData
      console.log('🛒 [MEDUSA ORDER] 🎉 Order completed successfully in Medusa!')
      console.log('🛒 [MEDUSA ORDER] 🎉 Medusa Order ID:', medusaOrder.id)
      console.log('🛒 [MEDUSA ORDER] 🎉 Order details:', {
        id: medusaOrder.id,
        email: medusaOrder.email,
        status: medusaOrder.status,
        total: medusaOrder.total,
        currency: medusaOrder.currency_code
      })

      // Transform and return the order
      return this.transformMedusaOrder(medusaOrder)

    } catch (error) {
      console.error('Error creating order in Medusa:', error)
      return null
    }
  }

  /**
   * Private: Get order from Medusa
   */
  private async getMedusaOrder(orderId: string): Promise<Order | null> {
    try {
      // Use the new /store/orders/:id endpoint
      // This endpoint supports both:
      // - Authenticated customers (can only see their own orders)
      // - Guest users (can see any order by ID)
      const response = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/orders/${orderId}`,
        {
          headers: {
            'x-publishable-api-key': this.config.publishableKey,
            // Include authentication token if available
            ...(this.getAuthHeaders()),
          },
        }
      )

      // Guest users can still fetch orders by ID
      // Only return null if order truly doesn't exist (404)
      if (response.status === 404) {
        console.warn('Order not found')
        return null
      }

      if (response.status === 403) {
        console.warn('Access denied - order belongs to a different customer')
        return null
      }

      if (!response.ok) {
        console.warn(`Failed to fetch order: ${response.status}`)
        return null
      }

      const { order } = await response.json()
      return this.transformMedusaOrder(order)
    } catch (error) {
      console.error('Error getting Medusa order:', error)
      return null
    }
  }

  /**
   * Private: Get orders by email from Medusa
   */
  private async getMedusaOrdersByEmail(email: string): Promise<Order[]> {
    try {
      // Use the new /store/orders endpoint
      // Note: This requires customer authentication
      const response = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/orders`,
        {
          headers: {
            'x-publishable-api-key': this.config.publishableKey,
            // Include authentication token if available
            ...(this.getAuthHeaders()),
          },
        }
      )

      if (response.status === 401) {
        console.warn('Authentication required to fetch orders')
        return []
      }

      if (!response.ok) {
        return []
      }

      const { orders } = await response.json()
      return orders.map((order: any) => this.transformMedusaOrder(order))
    } catch (error) {
      console.error('Error getting Medusa orders:', error)
      return []
    }
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    // Check for customer JWT token in localStorage or cookies
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('medusa_auth_token') ||
                    sessionStorage.getItem('medusa_auth_token')

      if (token) {
        return {
          'Authorization': `Bearer ${token}`
        }
      }
    }

    return {}
  }

  /**
   * Private: Update order in Medusa
   */
  private async updateMedusaOrder(orderId: string, updates: Partial<Order>): Promise<Order | null> {
    // Note: Medusa store API doesn't allow direct order updates
    // This would need to be done through admin API or custom endpoints
    return null
  }

  /**
   * Private: Transform Medusa order to our format
   */
  private transformMedusaOrder(medusaOrder: any): Order {
    // Handle both the new clean endpoint format and legacy format
    const items = medusaOrder.items || []
    const shipping_address = medusaOrder.shipping_address || {}
    const totals = medusaOrder.totals || {}

    return {
      id: medusaOrder.id,
      email: medusaOrder.email,
      items: items.map((item: any) => ({
        id: item.id || item.variant_id,
        name: item.title || item.name,
        sku: item.variant?.sku || item.sku || '',
        color: item.variant?.title || item.color || '',
        price: item.unit_price || item.price || 0,
        quantity: item.quantity || 1,
        image: item.thumbnail || item.image,
      })),
      shipping: {
        firstName: shipping_address.first_name || shipping_address.firstName || '',
        lastName: shipping_address.last_name || shipping_address.lastName || '',
        email: medusaOrder.email || shipping_address.email || '',
        phone: shipping_address.phone || '',
        address: shipping_address.address_1 || shipping_address.address || '',
        city: shipping_address.city || '',
        state: shipping_address.province || shipping_address.state || '',
        zipCode: shipping_address.postal_code || shipping_address.zipCode || '',
        country: shipping_address.country_code?.toUpperCase() || shipping_address.country || 'US',
      },
      totals: {
        subtotal: totals.subtotal || medusaOrder.subtotal || 0,
        shipping: totals.shipping_total || medusaOrder.shipping_total || 0,
        tax: totals.tax_total || medusaOrder.tax_total || 0,
        total: totals.total || medusaOrder.total || 0,
      },
      status: this.mapMedusaStatus(medusaOrder.status),
      paymentIntentId: medusaOrder.payment_status === 'captured'
        ? medusaOrder.payment_collections?.[0]?.payments?.[0]?.data?.intent_id
        : medusaOrder.paymentIntentId,
      createdAt: medusaOrder.created_at || medusaOrder.createdAt,
      updatedAt: medusaOrder.updated_at || medusaOrder.updatedAt,
      // Add timeline if available from new endpoint
      timeline: medusaOrder.timeline || undefined,
    }
  }

  /**
   * Private: Map Medusa status to our status
   */
  private mapMedusaStatus(medusaStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      pending: OrderStatus.PENDING,
      confirmed: OrderStatus.PROCESSING,
      shipped: OrderStatus.SHIPPED,
      delivered: OrderStatus.DELIVERED,
      canceled: OrderStatus.CANCELLED,
      requires_action: OrderStatus.PENDING,
    }
    return statusMap[medusaStatus] || OrderStatus.PENDING
  }

  /**
   * Private: Fetch with retry logic
   */
  private async fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        lastError = error as Error
        console.error(`Attempt ${attempt}/${this.config.maxRetries} failed:`, error)

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelay * attempt)
        }
      }
    }

    throw lastError || new Error('Failed after max retries')
  }

  /**
   * Private: Generate order ID
   */
  private generateOrderId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 11)
    return `order_${timestamp}_${random}`
  }

  /**
   * Private: Calculate order totals
   */
  private calculateTotals(items: OrderItem[]) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const shipping = 1000 // $10 flat rate
    const tax = Math.round(subtotal * 0.08) // 8% tax
    const total = subtotal + shipping + tax

    return { subtotal, shipping, tax, total }
  }

  /**
   * Private: Save order to fallback storage
   */
  private saveFallbackOrder(order: Order): Order {
    this.fallbackStorage.set(order.id, order)
    this.persistFallbackStorage()
    return order
  }

  /**
   * Private: Load fallback storage from localStorage
   */
  private loadFallbackStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem('fabric-store-orders')
      if (stored) {
        const orders = JSON.parse(stored)
        orders.forEach((order: Order) => {
          this.fallbackStorage.set(order.id, order)
        })
      }
    } catch (error) {
      console.error('Failed to load fallback storage:', error)
    }
  }

  /**
   * Private: Persist fallback storage to localStorage
   */
  private persistFallbackStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const orders = Array.from(this.fallbackStorage.values())
      localStorage.setItem('fabric-store-orders', JSON.stringify(orders))
    } catch (error) {
      console.error('Failed to persist fallback storage:', error)
    }
  }

  /**
   * Private: Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const orderService = new OrderService()