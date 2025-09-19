/**
 * Cart API Service
 *
 * Manages cart operations with Medusa backend.
 * Replaces LocalStorage-based cart when USE_NEW_CHECKOUT is enabled.
 */

import { isNewCheckoutEnabled, isDebugEnabled } from '../feature-flags'

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ''

export interface CartItem {
  id: string
  variant_id: string
  product_id: string
  title: string
  quantity: number
  unit_price: number
  subtotal: number
  total: number
  thumbnail?: string
  metadata?: Record<string, any>
}

export interface Cart {
  id: string
  email?: string
  customer_id?: string
  region_id: string
  currency_code: string
  items: CartItem[]
  shipping_address?: Address
  billing_address?: Address
  shipping_methods?: ShippingMethod[]
  subtotal: number
  tax_total: number
  shipping_total: number
  discount_total: number
  total: number
  created_at: string
  updated_at: string
  completed_at?: string
  metadata?: Record<string, any>
}

export interface Address {
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone?: string
}

export interface ShippingMethod {
  id: string
  option_id: string
  amount: number
  name?: string
}

export interface PaymentSession {
  id: string
  provider_id: string
  cart_id: string
  status: string
  data: {
    client_secret?: string
    payment_intent_id?: string
    publishable_key?: string
  }
  amount: number
  currency_code: string
  created_at: string
}

class CartApiService {
  private cartId: string | null = null
  private baseUrl: string
  private headers: HeadersInit

  constructor() {
    this.baseUrl = `${MEDUSA_BACKEND_URL}/store`
    this.headers = {
      'Content-Type': 'application/json',
      ...(PUBLISHABLE_KEY && { 'x-publishable-api-key': PUBLISHABLE_KEY }),
    }

    // Load cart ID from session storage
    if (typeof window !== 'undefined') {
      this.cartId = sessionStorage.getItem('medusa_cart_id')
    }
  }

  /**
   * Create a new cart
   */
  async createCart(data?: {
    email?: string
    region_id?: string
    currency_code?: string
  }): Promise<Cart> {
    try {
      const response = await fetch(`${this.baseUrl}/carts`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          region_id: data?.region_id || 'reg_01K5DPKAZ3AJRAR7N8SWSCVKSQ', // Default US region
          currency_code: data?.currency_code || 'usd',
          email: data?.email,
          metadata: {
            source: 'fabric-store',
            session_id: this.getSessionId(),
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create cart: ${response.statusText}`)
      }

      const { cart } = await response.json()
      this.cartId = cart.id

      // Store cart ID in session
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('medusa_cart_id', cart.id)
      }

      this.logDebug('Cart created:', cart.id)
      return cart
    } catch (error) {
      console.error('Cart creation failed:', error)
      throw error
    }
  }

  /**
   * Get current cart or create new one
   */
  async getCart(): Promise<Cart> {
    try {
      // If no cart ID, create new cart
      if (!this.cartId) {
        return await this.createCart()
      }

      const response = await fetch(`${this.baseUrl}/carts/${this.cartId}`, {
        headers: this.headers,
      })

      if (!response.ok) {
        // Cart might be expired or invalid, create new one
        if (response.status === 404 || response.status === 410) {
          this.clearCartId()
          return await this.createCart()
        }
        throw new Error(`Failed to get cart: ${response.statusText}`)
      }

      const { cart } = await response.json()
      return cart
    } catch (error) {
      console.error('Get cart failed:', error)
      // Fallback to creating new cart
      this.clearCartId()
      return await this.createCart()
    }
  }

  /**
   * Add item to cart
   */
  async addItem(data: {
    variant_id: string
    quantity: number
    metadata?: Record<string, any>
  }): Promise<Cart> {
    try {
      // Ensure we have a cart
      const cart = await this.getCart()

      const response = await fetch(`${this.baseUrl}/carts/${cart.id}/line-items`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'X-Idempotency-Key': `add-item-${data.variant_id}-${Date.now()}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to add item: ${response.statusText}`)
      }

      const { cart: updatedCart } = await response.json()
      this.logDebug('Item added to cart')

      // Dispatch event for UI updates
      this.dispatchCartEvent('add', updatedCart)

      return updatedCart
    } catch (error) {
      console.error('Add item failed:', error)
      throw error
    }
  }

  /**
   * Update item quantity
   */
  async updateItem(itemId: string, quantity: number): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available')
      }

      const response = await fetch(`${this.baseUrl}/carts/${this.cartId}/line-items/${itemId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        throw new Error(`Failed to update item: ${response.statusText}`)
      }

      const { cart } = await response.json()
      this.logDebug('Item updated')

      // Dispatch event for UI updates
      this.dispatchCartEvent('update', cart)

      return cart
    } catch (error) {
      console.error('Update item failed:', error)
      throw error
    }
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available')
      }

      const response = await fetch(`${this.baseUrl}/carts/${this.cartId}/line-items/${itemId}`, {
        method: 'DELETE',
        headers: this.headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to remove item: ${response.statusText}`)
      }

      const { cart } = await response.json()
      this.logDebug('Item removed')

      // Dispatch event for UI updates
      this.dispatchCartEvent('remove', cart)

      return cart
    } catch (error) {
      console.error('Remove item failed:', error)
      throw error
    }
  }

  /**
   * Set cart addresses
   */
  async setAddresses(data: {
    shipping_address: Address
    billing_address?: Address
  }): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available')
      }

      const response = await fetch(`${this.baseUrl}/carts/${this.cartId}/addresses`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Failed to set addresses: ${response.statusText}`)
      }

      const { cart } = await response.json()
      this.logDebug('Addresses set')
      return cart
    } catch (error) {
      console.error('Set addresses failed:', error)
      throw error
    }
  }

  /**
   * Add shipping method
   */
  async addShippingMethod(optionId: string): Promise<Cart> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available')
      }

      const response = await fetch(`${this.baseUrl}/carts/${this.cartId}/shipping-methods`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ option_id: optionId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to add shipping method: ${response.statusText}`)
      }

      const { cart } = await response.json()
      this.logDebug('Shipping method added')
      return cart
    } catch (error) {
      console.error('Add shipping method failed:', error)
      throw error
    }
  }

  /**
   * Create payment session
   */
  async createPaymentSession(providerId: string = 'stripe'): Promise<PaymentSession> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available')
      }

      const response = await fetch(`${this.baseUrl}/carts/${this.cartId}/payment-sessions`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'X-Idempotency-Key': `payment-${this.cartId}-${Date.now()}`,
        },
        body: JSON.stringify({ provider_id: providerId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Failed to create payment session: ${response.statusText}`)
      }

      const { payment_session } = await response.json()
      this.logDebug('Payment session created')
      return payment_session
    } catch (error) {
      console.error('Create payment session failed:', error)
      throw error
    }
  }

  /**
   * Complete checkout
   */
  async completeCheckout(paymentIntentId: string): Promise<{ order: any }> {
    try {
      if (!this.cartId) {
        throw new Error('No cart available')
      }

      const response = await fetch(`${this.baseUrl}/carts/${this.cartId}/complete`, {
        method: 'POST',
        headers: {
          ...this.headers,
          'X-Idempotency-Key': `complete-${this.cartId}-${Date.now()}`,
        },
        body: JSON.stringify({ payment_intent_id: paymentIntentId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Failed to complete checkout: ${response.statusText}`)
      }

      const result = await response.json()

      // Clear cart after successful checkout
      this.clearCartId()

      this.logDebug('Checkout completed:', result.order?.id)
      return result
    } catch (error) {
      console.error('Complete checkout failed:', error)
      throw error
    }
  }

  /**
   * Clear cart ID from storage
   */
  private clearCartId(): void {
    this.cartId = null
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('medusa_cart_id')
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') return ''

    let sessionId = sessionStorage.getItem('session_id')
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      sessionStorage.setItem('session_id', sessionId)
    }
    return sessionId
  }

  /**
   * Dispatch cart event for UI updates
   */
  private dispatchCartEvent(action: string, cart: Cart): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cart-updated', {
        detail: { action, cart }
      }))
    }
  }

  /**
   * Debug logging
   */
  private logDebug(...args: any[]): void {
    if (isDebugEnabled()) {
      console.log('[CartAPI]', ...args)
    }
  }
}

// Export singleton instance
export const cartApiService = new CartApiService()

// Export convenience functions
export const createCart = (data?: any) => cartApiService.createCart(data)
export const getCart = () => cartApiService.getCart()
export const addToCart = (data: any) => cartApiService.addItem(data)
export const updateCartItem = (id: string, quantity: number) => cartApiService.updateItem(id, quantity)
export const removeFromCart = (id: string) => cartApiService.removeItem(id)
export const setCartAddresses = (data: any) => cartApiService.setAddresses(data)
export const addShippingMethod = (optionId: string) => cartApiService.addShippingMethod(optionId)
export const createPaymentSession = (providerId?: string) => cartApiService.createPaymentSession(providerId)
export const completeCheckout = (paymentIntentId: string) => cartApiService.completeCheckout(paymentIntentId)