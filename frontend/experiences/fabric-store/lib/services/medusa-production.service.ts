/**
 * Production Medusa v2 Service
 * Industry best practices for Medusa integration
 * Follows official Medusa patterns and workflows
 */

import { z } from 'zod'

// Validation schemas
const OrderItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  variant_id: z.string().optional(),
  product_id: z.string().optional(),
  quantity: z.number().min(1),
  price: z.number().min(0),
  color: z.string().optional(),
  sku: z.string().optional(),
  image: z.string().optional(),
  type: z.string().optional()
})

const AddressSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  address_1: z.string(),
  address_2: z.string().optional(),
  city: z.string(),
  province: z.string(),
  postal_code: z.string(),
  country_code: z.string(),
  phone: z.string().optional()
})

const CreateOrderSchema = z.object({
  email: z.string().email(),
  items: z.array(OrderItemSchema).min(1),
  shipping_address: AddressSchema,
  billing_address: AddressSchema.optional(),
  region_id: z.string().optional(),
  payment_intent_id: z.string().optional()
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
export type OrderItem = z.infer<typeof OrderItemSchema>
export type Address = z.infer<typeof AddressSchema>

export interface MedusaOrder {
  id: string
  display_id: number
  status: string
  email: string
  currency_code: string
  total: number
  subtotal: number
  tax_total: number
  shipping_total: number
  items: Array<{
    id: string
    title: string
    subtitle?: string
    quantity: number
    unit_price: number
    total: number
    metadata?: any
  }>
  shipping_address: any
  billing_address: any
  created_at: string
  updated_at: string
}

export class MedusaProductionService {
  private baseUrl: string
  private publishableKey: string

  constructor() {
    this.baseUrl = process.env.MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || ''
    this.publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

    if (!this.baseUrl || !this.publishableKey) {
      console.warn('⚠️ Medusa configuration missing')
    }
  }

  /**
   * Create order using production Medusa workflows
   */
  async createOrder(input: CreateOrderInput): Promise<MedusaOrder> {
    // Validate input
    const validated = CreateOrderSchema.parse(input)

    console.log('🚀 [PRODUCTION] Creating Medusa order via workflows')

    try {
      // Transform items to Medusa format
      const medusaItems = validated.items.map(item => ({
        ...item,
        name: item.title,
        variant_id: this.mapToVariantId(item),
        product_id: this.mapToProductId(item)
      }))

      // Prepare order payload
      const orderPayload = {
        email: validated.email,
        items: medusaItems,
        shipping_address: validated.shipping_address,
        billing_address: validated.billing_address || validated.shipping_address,
        region_id: validated.region_id || 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ',
        payment_intent_id: validated.payment_intent_id
      }

      console.log('📦 Order payload prepared:', {
        email: orderPayload.email,
        items: orderPayload.items.length,
        region_id: orderPayload.region_id
      })

      // Call production Medusa API
      const response = await fetch(`${this.baseUrl}/store/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': this.publishableKey,
        },
        body: JSON.stringify(orderPayload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Medusa API error:', response.status, errorText)
        throw new Error(`Medusa API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Order creation failed')
      }

      console.log('✅ Order created successfully:', result.order.id)

      return result.order
    } catch (error) {
      console.error('❌ Production order creation failed:', error)
      throw error
    }
  }

  /**
   * Get order by ID using production API
   */
  async getOrderById(orderId: string): Promise<MedusaOrder | null> {
    try {
      const response = await fetch(`${this.baseUrl}/store/orders/${orderId}`, {
        headers: {
          'x-publishable-api-key': this.publishableKey,
        },
      })

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.status}`)
      }

      const { order } = await response.json()
      return order
    } catch (error) {
      console.error('Error fetching order:', error)
      return null
    }
  }

  /**
   * Get orders by email using production API
   */
  async getOrdersByEmail(email: string): Promise<MedusaOrder[]> {
    try {
      const response = await fetch(`${this.baseUrl}/store/orders-by-email?email=${encodeURIComponent(email)}`, {
        headers: {
          'x-publishable-api-key': this.publishableKey,
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch orders by email:', response.status)
        return []
      }

      const result = await response.json()

      if (result.success && Array.isArray(result.orders)) {
        return result.orders
      }

      return []
    } catch (error) {
      console.error('Error fetching orders by email:', error)
      return []
    }
  }

  /**
   * Map frontend item ID to Medusa variant ID
   */
  private mapToVariantId(item: OrderItem): string | null {
    // If already a variant ID, return as is
    if (item.id.startsWith('variant_')) {
      return item.id
    }

    // Product ID mapping to variants
    const productVariantMap: Record<string, string> = {
      // Sandwell Lipstick variants
      'prod_01K5C2CN06C8E90SGS1NY77JQD-swatch': 'variant_01K5C2CNNT6SDE68QZFJ8JM5H6',
      'prod_01K5C2CN06C8E90SGS1NY77JQD-yard': 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',
      'prod_01K5C2CN06C8E90SGS1NY77JQD': 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',

      // Add more mappings as needed
      'fabric-001': 'variant_01K5C2CNNTW2R5B6BHDJ8AQE4A',
      'swatch-001': 'variant_01K5C2CNNT6SDE68QZFJ8JM5H6',
    }

    // Check for direct mapping
    if (productVariantMap[item.id]) {
      return productVariantMap[item.id]
    }

    // Determine variant based on type
    if (item.id.startsWith('prod_')) {
      const isSwatch = item.type === 'swatch' ||
                      item.sku?.toLowerCase().includes('swatch') ||
                      item.title?.toLowerCase().includes('swatch')

      const mappingKey = isSwatch ? `${item.id}-swatch` : `${item.id}-yard`

      if (productVariantMap[mappingKey]) {
        return productVariantMap[mappingKey]
      }
    }

    console.warn('⚠️ No variant mapping found for:', item.id)
    return null
  }

  /**
   * Map frontend item to product ID
   */
  private mapToProductId(item: OrderItem): string | null {
    if (item.id.startsWith('prod_')) {
      return item.id.split('-')[0] // Remove variant suffix
    }

    // Legacy mapping
    const legacyProductMap: Record<string, string> = {
      'fabric-001': 'prod_01K5C2CN06C8E90SGS1NY77JQD',
      'swatch-001': 'prod_01K5C2CN06C8E90SGS1NY77JQD',
    }

    return legacyProductMap[item.id] || null
  }

  /**
   * Get available regions
   */
  async getRegions() {
    try {
      const response = await fetch(`${this.baseUrl}/store/regions`, {
        headers: {
          'x-publishable-api-key': this.publishableKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch regions: ${response.status}`)
      }

      const { regions } = await response.json()
      return regions
    } catch (error) {
      console.error('Error fetching regions:', error)
      return []
    }
  }
}

// Singleton instance
export const medusaProductionService = new MedusaProductionService()