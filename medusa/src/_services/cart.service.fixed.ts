/**
 * Cart Service - Fixed for Medusa v2
 *
 * Proper service implementation without MedusaService wrapper
 */

import {
  CreateCartDTO,
  UpdateCartDTO,
  CartDTO,
  ICartModuleService,
  IProductModuleService,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { normalizeQuantity, QuantityRules } from "./inventory-policy.service";

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
  private productModuleService_: IProductModuleService

  constructor(container: any) {
    // Inject cart module service
    this.cartModuleService_ = container.cartModuleService
    this.productModuleService_ = container[Modules.PRODUCT]
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

  private async getVariantInventoryRules(variantId: string): Promise<QuantityRules | null> {
    try {
      const variant: any = await this.productModuleService_.retrieveVariant(variantId)
      const productId = variant?.product_id || variant?.product?.id
      let policy: any = variant?.metadata?.inventory
      if (!policy && productId) {
        const product: any = await this.productModuleService_.retrieveProduct(productId, {
          select: ["id", "metadata"],
        })
        policy = product?.metadata?.inventory
      }
      if (!policy) return null

      const rules: QuantityRules = {
        min_increment: typeof policy.min_increment === "number" ? policy.min_increment : 1,
        min_cut: typeof policy.min_cut === "number" ? policy.min_cut : undefined,
        rounding_mode: policy.rounding_mode || "nearest",
        backorder_policy: policy.backorder_policy || "deny",
      }
      return rules
    } catch (e) {
      // If variant lookup fails, fall back to no normalization
      return null
    }
  }

  async addLineItem(cartId: string, input: AddLineItemInput): Promise<CartDTO> {
    try {
      // Normalize quantity per inventory policy if available
      let normalizedQty = input.quantity
      const rules = await this.getVariantInventoryRules(input.variant_id)
      if (rules) {
        const n = normalizeQuantity(input.quantity, rules)
        normalizedQty = n.decimal
      }

      // Add line item to cart (use normalized quantity)
      await this.cartModuleService_.addLineItems({
        cart_id: cartId,
        items: [{
          variant_id: input.variant_id,
          quantity: normalizedQty,
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

  async updateLineItem(cartId: string, itemId: string, quantity: number, variantId?: string): Promise<CartDTO> {
    try {
      let normalizedQty = quantity
      if (variantId) {
        const rules = await this.getVariantInventoryRules(variantId)
        if (rules) {
          const n = normalizeQuantity(quantity, rules)
          normalizedQty = n.decimal
        }
      }

      await this.cartModuleService_.updateLineItems(itemId, {
        quantity: normalizedQty,
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
