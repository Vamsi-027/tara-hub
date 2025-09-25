/**
 * Cart Service - Fixed for Medusa v2
 *
 * Proper service implementation without MedusaService wrapper
 */

import { 
  CreateCartDTO, 
  UpdateCartDTO, 
  CartDTO,
  ICartModuleService
} from "@medusajs/framework/types"

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

// Standard TypeScript class - no MedusaService wrapper
export default class CartService {
  private cartModuleService_: ICartModuleService

  constructor(container: any) {
    // Inject cart module service
    this.cartModuleService_ = container.cartModuleService
  }

  async createCart(input: CreateCartInput): Promise<CartDTO> {
    try {
      const cartData: CreateCartDTO = {
        region_id: input.region_id,
        email: input.email,
        currency_code: input.currency_code || 'usd',
        metadata: input.metadata || {},
      }

      const cart = await this.cartModuleService_.createCarts(cartData)
      return cart
    } catch (error) {
      console.error('Cart creation failed:', error)
      throw new Error(`Failed to create cart: ${error.message}`)
    }
  }

  async getCart(cartId: string): Promise<CartDTO> {
    try {
      const cart = await this.cartModuleService_.retrieveCart(cartId, {
        relations: ['items', 'shipping_address', 'billing_address']
      })
      return cart
    } catch (error) {
      console.error('Cart retrieval failed:', error)
      throw new Error(`Failed to get cart: ${error.message}`)
    }
  }

  async addLineItem(cartId: string, input: AddLineItemInput): Promise<CartDTO> {
    try {
      // Add line item to cart
      await this.cartModuleService_.addLineItems({
        cart_id: cartId,
        items: [{
          variant_id: input.variant_id,
          quantity: input.quantity,
          metadata: input.metadata || {},
        }]
      })

      // Return updated cart
      return await this.getCart(cartId)
    } catch (error) {
      console.error('Add line item failed:', error)
      throw new Error(`Failed to add item to cart: ${error.message}`)
    }
  }

  async updateLineItem(cartId: string, itemId: string, quantity: number): Promise<CartDTO> {
    try {
      await this.cartModuleService_.updateLineItems(itemId, {
        quantity: quantity
      })

      return await this.getCart(cartId)
    } catch (error) {
      console.error('Update line item failed:', error)
      throw new Error(`Failed to update cart item: ${error.message}`)
    }
  }

  async removeLineItem(cartId: string, itemId: string): Promise<CartDTO> {
    try {
      await this.cartModuleService_.deleteLineItems([itemId])
      return await this.getCart(cartId)
    } catch (error) {
      console.error('Remove line item failed:', error)
      throw new Error(`Failed to remove cart item: ${error.message}`)
    }
  }
}