/**
 * Medusa v2 API Service
 * Professional service for interacting with Medusa v2 backend
 * Follows industry best practices for API integration
 */

import { z } from 'zod'

// Medusa v2 API Response Schemas
const MedusaAddressSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  address_1: z.string(),
  address_2: z.string().nullable(),
  city: z.string(),
  province: z.string().nullable(),
  postal_code: z.string(),
  country_code: z.string(),
  metadata: z.record(z.any()).nullable(),
})

const MedusaLineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().nullable(),
  thumbnail: z.string().nullable(),
  variant: z.object({
    id: z.string(),
    title: z.string(),
    sku: z.string().nullable(),
    product: z.object({
      id: z.string(),
      title: z.string(),
      thumbnail: z.string().nullable(),
    }).nullable(),
  }).nullable(),
  variant_id: z.string().nullable(),
  product_id: z.string().nullable(),
  product_title: z.string().nullable(),
  product_description: z.string().nullable(),
  product_subtitle: z.string().nullable(),
  product_type: z.string().nullable(),
  product_collection: z.string().nullable(),
  product_handle: z.string().nullable(),
  variant_sku: z.string().nullable(),
  variant_barcode: z.string().nullable(),
  variant_title: z.string().nullable(),
  variant_option_values: z.record(z.any()).nullable(),
  is_return: z.boolean(),
  is_giftcard: z.boolean(),
  should_merge: z.boolean(),
  allow_discounts: z.boolean(),
  has_shipping: z.boolean(),
  unit_price: z.number(),
  quantity: z.number(),
  fulfilled_quantity: z.number(),
  returned_quantity: z.number(),
  shipped_quantity: z.number(),
  refundable_amount: z.number().nullable(),
  subtotal: z.number().nullable(),
  tax_total: z.number().nullable(),
  total: z.number().nullable(),
  original_total: z.number().nullable(),
  original_tax_total: z.number().nullable(),
  discount_total: z.number().nullable(),
  raw_discount_total: z.number().nullable(),
  gift_card_total: z.number().nullable(),
  includes_tax: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.any()).nullable(),
})

const MedusaOrderSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'completed', 'archived', 'canceled', 'requires_action']),
  fulfillment_status: z.enum(['not_fulfilled', 'partially_fulfilled', 'fulfilled', 'partially_shipped', 'shipped', 'partially_returned', 'returned', 'canceled', 'requires_action']),
  payment_status: z.enum(['not_paid', 'awaiting', 'captured', 'partially_refunded', 'refunded', 'canceled', 'requires_action']),
  display_id: z.number(),
  cart_id: z.string().nullable(),
  customer_id: z.string().nullable(),
  email: z.string(),
  billing_address_id: z.string().nullable(),
  billing_address: MedusaAddressSchema.nullable(),
  shipping_address_id: z.string().nullable(),
  shipping_address: MedusaAddressSchema.nullable(),
  region_id: z.string(),
  currency_code: z.string(),
  tax_rate: z.number().nullable(),
  discounts: z.array(z.any()),
  gift_cards: z.array(z.any()),
  shipping_methods: z.array(z.any()),
  payments: z.array(z.any()),
  fulfillments: z.array(z.any()),
  returns: z.array(z.any()),
  claims: z.array(z.any()),
  refunds: z.array(z.any()),
  swaps: z.array(z.any()),
  draft_order_id: z.string().nullable(),
  items: z.array(MedusaLineItemSchema),
  edits: z.array(z.any()),
  gift_card_transactions: z.array(z.any()),
  canceled_at: z.string().nullable(),
  no_notification: z.boolean().nullable(),
  idempotency_key: z.string().nullable(),
  external_id: z.string().nullable(),
  sales_channel_id: z.string().nullable(),
  shipping_total: z.number(),
  discount_total: z.number(),
  tax_total: z.number(),
  refunded_total: z.number(),
  total: z.number(),
  subtotal: z.number(),
  paid_total: z.number(),
  refundable_amount: z.number(),
  gift_card_total: z.number(),
  gift_card_tax_total: z.number(),
  returnable_items: z.array(z.any()),
  created_at: z.string(),
  updated_at: z.string(),
  metadata: z.record(z.any()).nullable(),
})

export type MedusaOrder = z.infer<typeof MedusaOrderSchema>
export type MedusaLineItem = z.infer<typeof MedusaLineItemSchema>
export type MedusaAddress = z.infer<typeof MedusaAddressSchema>

// Fabric-Store Order Interface (normalized)
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
  status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'failed'
  paymentIntentId?: string
  tracking?: string
  createdAt: string
  updatedAt: string
  timeline?: TimelineEvent[]
  notes?: OrderNote[]
}

export interface OrderItem {
  id: string
  name: string
  sku: string
  color: string
  price: number
  quantity: number
  image?: string
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface TimelineEvent {
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

// API Configuration
interface MedusaConfig {
  baseUrl: string
  publishableKey: string
  adminApiKey?: string
}

export class MedusaV2Service {
  private config: MedusaConfig
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  constructor(config: MedusaConfig) {
    this.config = config
  }

  /**
   * Get order by ID using admin API
   * This is the most reliable method for fetching order details
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      console.log(`🔍 Fetching order ${orderId} from Medusa...`)

      // Strategy 1: Try raw database query (bypasses serialization issues)
      const rawOrder = await this.getOrderFromRawAPI(orderId)
      if (rawOrder) {
        console.log(`✅ Found order ${orderId} via raw database query`)
        return this.transformRawOrder(rawOrder)
      }

      // Strategy 2: Try admin API (for normal Medusa orders)
      const adminOrder = await this.getOrderFromAdmin(orderId)
      if (adminOrder) {
        console.log(`✅ Found order ${orderId} via admin API`)
        return this.transformMedusaOrder(adminOrder)
      }

      // Strategy 3: Try store API with publishable key
      const storeOrder = await this.getOrderFromStore(orderId)
      if (storeOrder) {
        console.log(`✅ Found order ${orderId} via store API`)
        return this.transformMedusaOrder(storeOrder)
      }

      console.warn(`❌ Order ${orderId} not found in any Medusa endpoint`)
      return null

    } catch (error) {
      console.error(`❌ Error fetching order ${orderId}:`, error)
      throw new Error(`Failed to fetch order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get order from raw database API (bypasses Medusa serialization issues)
   */
  private async getOrderFromRawAPI(orderId: string): Promise<any | null> {
    try {
      console.log(`🔍 Fetching order ${orderId} from raw database API...`)

      const response = await fetch(`${this.config.baseUrl}/store/orders-raw/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': this.config.publishableKey,
        },
      })

      if (response.status === 404) {
        console.log(`❌ Order ${orderId} not found in raw database API`)
        return null
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`❌ Raw API failed: ${response.status} - ${errorText}`)
        return null
      }

      const data = await response.json()
      if (data.success && data.order) {
        console.log(`✅ Order ${orderId} found via raw database API`)
        return data.order
      }

      return null

    } catch (error) {
      console.error(`❌ Raw API error for order ${orderId}:`, error)
      return null
    }
  }

  /**
   * Transform raw database order to fabric-store format
   */
  private transformRawOrder(rawOrder: any): Order {
    return {
      id: rawOrder.id,
      email: rawOrder.email,
      items: rawOrder.items?.map((item: any) => ({
        id: item.id,
        name: item.name || item.title,
        sku: item.sku || item.id,
        color: item.color || '',
        price: item.price || item.unit_price,
        quantity: item.quantity,
        image: item.image || item.thumbnail,
      })) || [],
      shipping: rawOrder.shipping || {
        firstName: '',
        lastName: '',
        email: rawOrder.email,
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      },
      totals: rawOrder.totals || {
        subtotal: rawOrder.subtotal || 0,
        shipping: rawOrder.shipping_total || 0,
        tax: rawOrder.tax_total || 0,
        total: rawOrder.total || 0,
      },
      status: this.mapMedusaStatus(rawOrder.status || 'pending'),
      paymentIntentId: rawOrder.payment_intent_id,
      tracking: rawOrder.tracking_number,
      createdAt: rawOrder.created_at,
      updatedAt: rawOrder.updated_at,
      timeline: rawOrder.timeline,
      notes: rawOrder.notes,
    }
  }

  /**
   * Get orders by customer email using admin API
   */
  async getOrdersByEmail(email: string): Promise<Order[]> {
    try {
      console.log(`🔍 Fetching orders for ${email} from Medusa...`)

      // Use admin API to search orders by email
      const response = await this.fetchWithAuth(`${this.config.baseUrl}/admin/orders?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return []
        }
        throw new Error(`Admin API error: ${response.status}`)
      }

      const data = await response.json()
      const orders = data.orders || []

      console.log(`✅ Found ${orders.length} orders for ${email}`)
      return orders.map((order: MedusaOrder) => this.transformMedusaOrder(order))

    } catch (error) {
      console.error(`❌ Error fetching orders for ${email}:`, error)
      throw new Error(`Failed to fetch orders: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Private: Get order from admin API
   */
  private async getOrderFromAdmin(orderId: string): Promise<MedusaOrder | null> {
    try {
      const response = await this.fetchWithAuth(`${this.config.baseUrl}/admin/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Admin API error: ${response.status}`)
      }

      const data = await response.json()
      return MedusaOrderSchema.parse(data.order)

    } catch (error) {
      console.warn(`Admin API failed for order ${orderId}:`, error)
      return null
    }
  }

  /**
   * Private: Get order from store API
   */
  private async getOrderFromStore(orderId: string): Promise<MedusaOrder | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/store/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': this.config.publishableKey,
        },
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Store API error: ${response.status}`)
      }

      const data = await response.json()
      return MedusaOrderSchema.parse(data.order)

    } catch (error) {
      console.warn(`Store API failed for order ${orderId}:`, error)
      return null
    }
  }

  /**
   * Private: Make authenticated request to admin API
   */
  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // First try with admin API key if available
    if (this.config.adminApiKey) {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${this.config.adminApiKey}`,
        },
      })
    }

    // Fallback: try to get admin token via login
    const adminToken = await this.getAdminToken()
    if (adminToken) {
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${adminToken}`,
        },
      })
    }

    throw new Error('No admin authentication available')
  }

  /**
   * Private: Get admin token via login
   */
  private async getAdminToken(): Promise<string | null> {
    try {
      // Check cache first
      const cached = this.cache.get('admin_token')
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data
      }

      const response = await fetch(`${this.config.baseUrl}/auth/user/emailpass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@tara-hub.com',
          password: 'password'
        })
      })

      if (!response.ok) {
        throw new Error('Admin login failed')
      }

      const data = await response.json()
      const token = data.token

      // Cache the token
      this.cache.set('admin_token', { data: token, timestamp: Date.now() })

      return token

    } catch (error) {
      console.error('Failed to get admin token:', error)
      return null
    }
  }

  /**
   * Get orders by customer email using store API
   */
  async getOrdersByEmail(email: string, limit = 50, offset = 0): Promise<{ orders: Order[]; hasMore: boolean }> {
    try {
      console.log(`🔍 Fetching orders for email ${email} from Medusa...`)

      // Try the new store endpoint that bypasses serialization issues
      const response = await fetch(`${this.config.baseUrl}/store/orders-by-email?email=${encodeURIComponent(email)}&limit=${limit}&offset=${offset}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': this.config.publishableKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn(`❌ Failed to fetch orders by email: ${response.status} - ${errorText}`)
        return { orders: [], hasMore: false }
      }

      const data = await response.json()

      if (data.success && data.orders && Array.isArray(data.orders)) {
        console.log(`✅ Found ${data.orders.length} orders for ${email}`)

        // Transform raw orders to fabric-store format
        const transformedOrders = data.orders.map((rawOrder: any) => this.transformRawOrder(rawOrder))

        return {
          orders: transformedOrders,
          hasMore: data.hasMore || false
        }
      }

      console.warn(`❌ Invalid response format from orders-by-email endpoint:`, data)
      return { orders: [], hasMore: false }

    } catch (error) {
      console.error(`❌ Error fetching orders by email ${email}:`, error)
      return { orders: [], hasMore: false }
    }
  }

  /**
   * Private: Transform Medusa order to fabric-store format
   */
  private transformMedusaOrder(medusaOrder: MedusaOrder): Order {
    // Extract items
    const items: OrderItem[] = medusaOrder.items.map(item => ({
      id: item.id,
      name: item.title,
      sku: item.variant_sku || item.variant?.sku || `sku-${item.id}`,
      color: this.extractColorFromVariant(item),
      price: item.unit_price,
      quantity: item.quantity,
      image: item.thumbnail || item.variant?.product?.thumbnail || undefined,
    }))

    // Extract shipping address
    const shipping: ShippingAddress = {
      firstName: medusaOrder.shipping_address?.first_name || '',
      lastName: medusaOrder.shipping_address?.last_name || '',
      email: medusaOrder.email,
      phone: medusaOrder.shipping_address?.phone || '',
      address: medusaOrder.shipping_address?.address_1 || '',
      city: medusaOrder.shipping_address?.city || '',
      state: medusaOrder.shipping_address?.province || '',
      zipCode: medusaOrder.shipping_address?.postal_code || '',
      country: medusaOrder.shipping_address?.country_code || 'US',
    }

    // Calculate totals (ensure they're in cents)
    const totals = {
      subtotal: medusaOrder.subtotal,
      shipping: medusaOrder.shipping_total,
      tax: medusaOrder.tax_total,
      total: medusaOrder.total,
    }

    // Map Medusa status to fabric-store status
    const status = this.mapMedusaStatus(medusaOrder.status, medusaOrder.payment_status, medusaOrder.fulfillment_status)

    // Create timeline from order history
    const timeline: TimelineEvent[] = [
      {
        status: 'created',
        timestamp: medusaOrder.created_at,
        message: 'Order created',
        metadata: { display_id: medusaOrder.display_id },
      },
    ]

    // Add payment status to timeline
    if (medusaOrder.payment_status !== 'not_paid') {
      timeline.push({
        status: medusaOrder.payment_status,
        timestamp: medusaOrder.updated_at,
        message: `Payment ${medusaOrder.payment_status}`,
      })
    }

    // Add fulfillment status to timeline
    if (medusaOrder.fulfillment_status !== 'not_fulfilled') {
      timeline.push({
        status: medusaOrder.fulfillment_status,
        timestamp: medusaOrder.updated_at,
        message: `Fulfillment ${medusaOrder.fulfillment_status}`,
      })
    }

    return {
      id: medusaOrder.id,
      email: medusaOrder.email,
      items,
      shipping,
      totals,
      status,
      createdAt: medusaOrder.created_at,
      updatedAt: medusaOrder.updated_at,
      timeline,
      notes: [], // Could be populated from order edits/comments if available
    }
  }

  /**
   * Private: Extract color information from line item variant
   */
  private extractColorFromVariant(item: MedusaLineItem): string {
    // Try to extract color from variant options
    if (item.variant_option_values) {
      const colorOption = item.variant_option_values['Color'] ||
                         item.variant_option_values['color'] ||
                         item.variant_option_values['Colour'] ||
                         item.variant_option_values['colour']
      if (colorOption) return String(colorOption)
    }

    // Fallback to variant title parsing
    if (item.variant_title) {
      // Common patterns: "Red", "Blue - Large", "Green / Medium"
      const colorMatch = item.variant_title.match(/^([^-/]+)/)
      if (colorMatch) return colorMatch[1].trim()
    }

    return 'N/A'
  }

  /**
   * Private: Map Medusa statuses to fabric-store status
   */
  private mapMedusaStatus(
    orderStatus: MedusaOrder['status'],
    paymentStatus: MedusaOrder['payment_status'],
    fulfillmentStatus: MedusaOrder['fulfillment_status']
  ): Order['status'] {
    // Cancelled orders
    if (orderStatus === 'canceled') return 'cancelled'

    // Payment-based status mapping
    if (paymentStatus === 'captured' || paymentStatus === 'awaiting') {
      // Order is paid, check fulfillment
      if (fulfillmentStatus === 'shipped') return 'shipped'
      if (fulfillmentStatus === 'fulfilled') return 'delivered'
      if (fulfillmentStatus === 'partially_fulfilled' || fulfillmentStatus === 'partially_shipped') return 'processing'
      return 'paid'
    }

    // Payment not completed
    if (paymentStatus === 'not_paid' || paymentStatus === 'requires_action') return 'pending'
    if (paymentStatus === 'canceled') return 'failed'

    // Default mapping
    if (orderStatus === 'completed') return 'delivered'
    if (orderStatus === 'pending') return 'pending'

    return 'processing'
  }
}

// Factory function to create service instance
export function createMedusaV2Service(): MedusaV2Service {
  const config: MedusaConfig = {
    baseUrl: process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || '',
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
    adminApiKey: process.env.MEDUSA_ADMIN_API_KEY, // Optional
  }

  if (!config.baseUrl || !config.publishableKey) {
    throw new Error('Missing Medusa configuration. Please check your environment variables.')
  }

  return new MedusaV2Service(config)
}

// Export singleton instance
export const medusaV2Service = createMedusaV2Service()