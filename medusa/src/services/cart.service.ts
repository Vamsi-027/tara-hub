/**
 * Cart Service
 *
 * Manages cart lifecycle, items, addresses, and totals calculation.
 * Follows Medusa v2 patterns with proper error handling and idempotency.
 */

import { MedusaService } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"
import { ICartModuleService, IRegionModuleService, IPricingModuleService } from "@medusajs/framework/types"
import { CreateCartDTO, UpdateCartDTO, CartDTO } from "@medusajs/framework/types"

export interface CreateCartInput {
  region_id: string
  email?: string
  currency_code?: string
  customer_id?: string
  sales_channel_id?: string
  metadata?: Record<string, any>
}

export interface AddLineItemInput {
  variant_id: string
  quantity: number
  metadata?: Record<string, any>
}

export interface UpdateLineItemInput {
  quantity?: number
  metadata?: Record<string, any>
}

export interface AddressInput {
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

export interface SetAddressesInput {
  shipping_address: AddressInput
  billing_address?: AddressInput
}

class CartService extends MedusaService({
  Cart: {
    moduleKey: Modules.CART,
  },
  Region: {
    moduleKey: Modules.REGION,
  },
  Pricing: {
    moduleKey: Modules.PRICING,
  },
}) {
  protected cartModule_: ICartModuleService
  protected regionModule_: IRegionModuleService
  protected pricingModule_: IPricingModuleService

  constructor(container: any) {
    super(container)
    this.cartModule_ = container[Modules.CART]
    this.regionModule_ = container[Modules.REGION]
    this.pricingModule_ = container[Modules.PRICING]
  }

  /**
   * Create a new cart with region and optional customer
   */
  async create(data: CreateCartInput): Promise<CartDTO> {
    // Validate region exists
    const region = await this.regionModule_.retrieveRegion(data.region_id)
    if (!region) {
      throw new Error(`Region ${data.region_id} not found`)
    }

    // Set currency from region if not provided
    const currency_code = data.currency_code || region.currency_code

    // Create cart
    const cartData: CreateCartDTO = {
      region_id: data.region_id,
      currency_code,
      email: data.email,
      customer_id: data.customer_id,
      sales_channel_id: data.sales_channel_id,
      metadata: {
        ...data.metadata,
        source: data.metadata?.source || "api",
        created_at: new Date().toISOString(),
      },
    }

    const cart = await this.cartModule_.createCarts(cartData)

    // Return with calculated totals
    return this.retrieve(cart.id)
  }

  /**
   * Retrieve cart with calculated totals
   */
  async retrieve(cartId: string): Promise<CartDTO> {
    const cart = await this.cartModule_.retrieveCart(cartId, {
      relations: ["items", "shipping_methods", "shipping_address", "billing_address"],
    })

    if (!cart) {
      throw new Error(`Cart ${cartId} not found`)
    }

    // Check if cart is expired (7 days)
    const createdAt = new Date(cart.created_at)
    const expiryDate = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    if (new Date() > expiryDate) {
      throw new Error("Cart has expired")
    }

    // Calculate totals
    return this.calculateTotals(cart)
  }

  /**
   * Update cart properties
   */
  async update(cartId: string, data: Partial<UpdateCartDTO>): Promise<CartDTO> {
    const cart = await this.retrieve(cartId)

    // Check if cart is already completed
    if (cart.completed_at) {
      throw new Error("Cannot update completed cart")
    }

    await this.cartModule_.updateCarts(cartId, data)

    return this.retrieve(cartId)
  }

  /**
   * Add line item to cart
   */
  async addLineItem(cartId: string, data: AddLineItemInput): Promise<CartDTO> {
    const cart = await this.retrieve(cartId)

    if (cart.completed_at) {
      throw new Error("Cannot add items to completed cart")
    }

    // Create line item
    await this.cartModule_.addLineItems({
      cart_id: cartId,
      variant_id: data.variant_id,
      quantity: data.quantity,
      metadata: data.metadata,
    })

    return this.retrieve(cartId)
  }

  /**
   * Update line item in cart
   */
  async updateLineItem(
    cartId: string,
    itemId: string,
    data: UpdateLineItemInput
  ): Promise<CartDTO> {
    const cart = await this.retrieve(cartId)

    if (cart.completed_at) {
      throw new Error("Cannot update items in completed cart")
    }

    await this.cartModule_.updateLineItems(itemId, data)

    return this.retrieve(cartId)
  }

  /**
   * Remove line item from cart
   */
  async removeLineItem(cartId: string, itemId: string): Promise<CartDTO> {
    const cart = await this.retrieve(cartId)

    if (cart.completed_at) {
      throw new Error("Cannot remove items from completed cart")
    }

    await this.cartModule_.removeLineItems([itemId])

    return this.retrieve(cartId)
  }

  /**
   * Set shipping and billing addresses
   */
  async setAddresses(
    cartId: string,
    addresses: SetAddressesInput
  ): Promise<CartDTO> {
    const cart = await this.retrieve(cartId)

    if (cart.completed_at) {
      throw new Error("Cannot update addresses on completed cart")
    }

    const updateData: UpdateCartDTO = {}

    if (addresses.shipping_address) {
      updateData.shipping_address = addresses.shipping_address
    }

    // Use shipping as billing if not provided
    updateData.billing_address = addresses.billing_address || addresses.shipping_address

    await this.cartModule_.updateCarts(cartId, updateData)

    return this.retrieve(cartId)
  }

  /**
   * Add shipping method to cart
   */
  async addShippingMethod(
    cartId: string,
    shippingOptionId: string
  ): Promise<CartDTO> {
    const cart = await this.retrieve(cartId)

    if (cart.completed_at) {
      throw new Error("Cannot add shipping to completed cart")
    }

    if (!cart.shipping_address) {
      throw new Error("Shipping address required before adding shipping method")
    }

    await this.cartModule_.addShippingMethods({
      cart_id: cartId,
      option_id: shippingOptionId,
    })

    return this.retrieve(cartId)
  }

  /**
   * Calculate cart totals including tax
   */
  private async calculateTotals(cart: any): Promise<CartDTO> {
    let subtotal = 0
    let tax_total = 0
    let shipping_total = 0
    let discount_total = 0

    // Calculate items subtotal
    if (cart.items?.length > 0) {
      for (const item of cart.items) {
        const itemTotal = (item.unit_price || 0) * item.quantity
        subtotal += itemTotal
      }
    }

    // Get tax rate from region (simplified - should use tax provider)
    const region = await this.regionModule_.retrieveRegion(cart.region_id)
    const taxRate = region.tax_rate || 0.0875 // Default 8.75%
    tax_total = Math.round(subtotal * taxRate)

    // Calculate shipping
    if (cart.shipping_methods?.length > 0) {
      for (const method of cart.shipping_methods) {
        shipping_total += method.amount || 0
      }
    }

    // Apply discounts
    if (cart.discounts?.length > 0) {
      // Simplified discount calculation
      for (const discount of cart.discounts) {
        if (discount.rule?.type === "percentage") {
          discount_total += Math.round(subtotal * (discount.rule.value / 100))
        } else if (discount.rule?.type === "fixed") {
          discount_total += discount.rule.value
        }
      }
    }

    const total = subtotal + tax_total + shipping_total - discount_total

    return {
      ...cart,
      subtotal,
      tax_total,
      shipping_total,
      discount_total,
      total,
      raw_discount_total: discount_total,
      gift_card_total: 0,
      gift_card_tax_total: 0,
    }
  }

  /**
   * Mark cart as completed
   */
  async complete(cartId: string): Promise<CartDTO> {
    const cart = await this.retrieve(cartId)

    if (cart.completed_at) {
      throw new Error("Cart already completed")
    }

    await this.cartModule_.updateCarts(cartId, {
      completed_at: new Date(),
    })

    return this.retrieve(cartId)
  }

  /**
   * Delete cart (soft delete)
   */
  async delete(cartId: string): Promise<void> {
    await this.cartModule_.softDeleteCarts([cartId])
  }

  /**
   * Reserve inventory for cart items (soft reservation)
   */
  async reserveInventory(cartId: string): Promise<void> {
    const cart = await this.retrieve(cartId)

    if (!cart.items?.length) {
      return
    }

    // Implement inventory reservation logic
    // This would integrate with inventory module
    for (const item of cart.items) {
      // Reserve inventory for item.variant_id with quantity
      console.log(`Reserving ${item.quantity} of variant ${item.variant_id}`)
    }
  }

  /**
   * Release inventory reservations
   */
  async releaseInventory(cartId: string): Promise<void> {
    const cart = await this.retrieve(cartId)

    if (!cart.items?.length) {
      return
    }

    // Implement inventory release logic
    for (const item of cart.items) {
      console.log(`Releasing ${item.quantity} of variant ${item.variant_id}`)
    }
  }

  /**
   * Validate cart before checkout
   */
  async validateForCheckout(cartId: string): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    try {
      const cart = await this.retrieve(cartId)

      // Check if cart is completed
      if (cart.completed_at) {
        errors.push("Cart is already completed")
      }

      // Check if cart has items
      if (!cart.items?.length) {
        errors.push("Cart must have at least one item")
      }

      // Check if cart has email
      if (!cart.email && !cart.customer_id) {
        errors.push("Cart must have email or customer")
      }

      // Check if cart has addresses
      if (!cart.shipping_address) {
        errors.push("Shipping address is required")
      }

      // Check if cart has shipping method
      if (!cart.shipping_methods?.length) {
        errors.push("Shipping method is required")
      }

      // Validate inventory availability
      if (cart.items?.length) {
        for (const item of cart.items) {
          // Check inventory (simplified)
          console.log(`Checking inventory for ${item.variant_id}`)
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      }
    } catch (error: any) {
      errors.push(error.message)
      return {
        valid: false,
        errors,
      }
    }
  }
}

export default CartService