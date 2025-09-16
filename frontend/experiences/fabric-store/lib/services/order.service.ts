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
  public timeout: number = 10000
  public useFallback: boolean = true

  private constructor() {
    this.medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
                     process.env.MEDUSA_BACKEND_URL ||
                     'http://localhost:9000'
    this.publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''
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
   * Private: Create order in Medusa backend
   */
  private async createMedusaOrder(order: Order): Promise<Order | null> {
    const url = `${this.config.medusaUrl}/store/fabric-orders`

    try {
      // Create order directly using fabric-orders endpoint
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': this.config.publishableKey,
        },
        body: JSON.stringify({
          orderId: order.id,
          email: order.email,
          items: order.items,
          shipping: order.shipping,
          totals: order.totals,
          paymentIntentId: order.paymentIntentId,
          status: order.status,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create order: ${response.status}`)
      }

      const { order: medusaOrder } = await response.json()

      // Transform the response to our format
      return {
        ...order,
        id: medusaOrder.id,
        createdAt: medusaOrder.created_at,
        updatedAt: medusaOrder.created_at,
      }
    } catch (error) {
      console.error('Error creating Medusa order:', error)
      throw error
    }
  }

  /**
   * Private: Get order from Medusa
   */
  private async getMedusaOrder(orderId: string): Promise<Order | null> {
    try {
      const response = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/orders/${orderId}`,
        {
          headers: {
            'x-publishable-api-key': this.config.publishableKey,
          },
        }
      )

      if (!response.ok) {
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
      const response = await this.fetchWithRetry(
        `${this.config.medusaUrl}/store/fabric-orders?email=${encodeURIComponent(email)}`,
        {
          headers: {
            'x-publishable-api-key': this.config.publishableKey,
          },
        }
      )

      if (!response.ok) {
        return []
      }

      const { orders } = await response.json()
      return orders.map((order: any) => this.transformMedusaOrder(order))
    } catch (error) {
      console.error('Error getting Medusa orders by email:', error)
      return []
    }
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
    return {
      id: medusaOrder.id,
      email: medusaOrder.email,
      items: medusaOrder.items?.map((item: any) => ({
        id: item.variant_id,
        name: item.title,
        sku: item.variant?.sku || '',
        color: item.variant?.title || '',
        price: item.unit_price,
        quantity: item.quantity,
        image: item.thumbnail,
      })) || [],
      shipping: {
        firstName: medusaOrder.shipping_address?.first_name || '',
        lastName: medusaOrder.shipping_address?.last_name || '',
        email: medusaOrder.email,
        phone: medusaOrder.shipping_address?.phone || '',
        address: medusaOrder.shipping_address?.address_1 || '',
        city: medusaOrder.shipping_address?.city || '',
        state: medusaOrder.shipping_address?.province || '',
        zipCode: medusaOrder.shipping_address?.postal_code || '',
        country: medusaOrder.shipping_address?.country_code?.toUpperCase() || 'US',
      },
      totals: {
        subtotal: medusaOrder.subtotal || 0,
        shipping: medusaOrder.shipping_total || 0,
        tax: medusaOrder.tax_total || 0,
        total: medusaOrder.total || 0,
      },
      status: this.mapMedusaStatus(medusaOrder.status),
      paymentIntentId: medusaOrder.payment?.data?.intent_id,
      createdAt: medusaOrder.created_at,
      updatedAt: medusaOrder.updated_at,
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
    const random = Math.random().toString(36).substr(2, 9)
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