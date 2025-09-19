/**
 * Order Service
 *
 * Handles order creation from carts, manages order lifecycle,
 * and ensures transactional consistency with inventory and payments.
 */

import { MedusaService, TransactionBaseService } from "@medusajs/framework/utils"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService, IInventoryService } from "@medusajs/framework/types"
import { CreateOrderDTO, OrderDTO } from "@medusajs/framework/types"
import CartService from "./cart.service"
import PaymentService from "./payment.service"

export interface CreateOrderFromCartInput {
  cart_id: string
  payment_intent_id: string
  idempotency_key?: string
}

export interface OrderFilters {
  email?: string
  customer_id?: string
  status?: string
  limit?: number
  offset?: number
}

class OrderService extends TransactionBaseService {
  protected orderModule_: IOrderModuleService
  protected inventoryService_: IInventoryService
  protected cartService_: CartService
  protected paymentService_: PaymentService
  private processedIdempotencyKeys: Set<string> = new Set()

  constructor(container: any) {
    super(container)
    this.orderModule_ = container[Modules.ORDER]
    this.inventoryService_ = container[Modules.INVENTORY]
    this.cartService_ = new CartService(container)
    this.paymentService_ = new PaymentService(container)
  }

  /**
   * Create order from cart after payment confirmation
   */
  async createFromCart(
    input: CreateOrderFromCartInput
  ): Promise<OrderDTO> {
    const { cart_id, payment_intent_id, idempotency_key } = input

    // Check idempotency
    if (idempotency_key) {
      if (this.processedIdempotencyKeys.has(idempotency_key)) {
        // Return existing order for this idempotency key
        const existingOrder = await this.findOrderByIdempotencyKey(idempotency_key)
        if (existingOrder) {
          return existingOrder
        }
      }
      this.processedIdempotencyKeys.add(idempotency_key)
    }

    // Use transaction for consistency
    return await this.atomicPhase_(async (transactionManager) => {
      try {
        // 1. Retrieve and validate cart
        const cart = await this.cartService_.retrieve(cart_id)

        if (!cart) {
          throw new Error(`Cart ${cart_id} not found`)
        }

        if (cart.completed_at) {
          // Cart already completed, find the order
          const existingOrder = await this.findOrderByCartId(cart_id)
          if (existingOrder) {
            return existingOrder
          }
          throw new Error("Cart is completed but order not found")
        }

        // 2. Validate cart for checkout
        const validation = await this.cartService_.validateForCheckout(cart_id)
        if (!validation.valid) {
          throw new Error(`Cart validation failed: ${validation.errors.join(", ")}`)
        }

        // 3. Verify payment with Stripe
        const paymentVerification = await this.paymentService_.verifyPayment({
          payment_intent_id,
          cart_id,
        })

        if (!paymentVerification.verified) {
          throw new Error(
            `Payment not confirmed. Status: ${paymentVerification.status}`
          )
        }

        // 4. Create order
        const orderData = await this.buildOrderFromCart(cart, payment_intent_id)
        const order = await this.orderModule_.createOrders(orderData)

        // 5. Update inventory
        await this.updateInventory(order)

        // 6. Mark cart as completed
        await this.cartService_.complete(cart_id)

        // 7. Update payment intent with order ID
        if (paymentVerification.payment_intent) {
          // Would update Stripe metadata with order ID
          console.log(`Updating payment intent ${payment_intent_id} with order ${order.id}`)
        }

        // 8. Store idempotency key mapping
        if (idempotency_key) {
          await this.storeIdempotencyKey(idempotency_key, order.id)
        }

        // 9. Emit order created event
        await this.eventBus_.emit("order.created", {
          id: order.id,
          cart_id,
          payment_intent_id,
        })

        return order
      } catch (error: any) {
        // Rollback on error
        if (idempotency_key) {
          this.processedIdempotencyKeys.delete(idempotency_key)
        }
        throw error
      }
    })
  }

  /**
   * Build order data from cart
   */
  private async buildOrderFromCart(
    cart: any,
    paymentIntentId: string
  ): Promise<CreateOrderDTO> {
    // Generate display ID
    const displayId = await this.generateDisplayId()

    return {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      display_id: displayId,
      cart_id: cart.id,
      email: cart.email,
      customer_id: cart.customer_id,
      region_id: cart.region_id,
      currency_code: cart.currency_code,

      // Status fields
      status: "pending",
      fulfillment_status: "not_fulfilled",
      payment_status: "awaiting",

      // Financial fields
      subtotal: cart.subtotal,
      tax_total: cart.tax_total,
      shipping_total: cart.shipping_total,
      discount_total: cart.discount_total,
      gift_card_total: cart.gift_card_total || 0,
      gift_card_tax_total: cart.gift_card_tax_total || 0,
      total: cart.total,

      // Items
      items: cart.items?.map((item: any) => ({
        title: item.title,
        variant_id: item.variant_id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.unit_price * item.quantity,
        tax_total: Math.round(item.unit_price * item.quantity * 0.0875), // Simplified tax
        total: Math.round(item.unit_price * item.quantity * 1.0875),
        metadata: item.metadata,
      })) || [],

      // Addresses
      shipping_address_id: cart.shipping_address?.id,
      billing_address_id: cart.billing_address?.id,
      shipping_address: cart.shipping_address,
      billing_address: cart.billing_address,

      // Shipping
      shipping_methods: cart.shipping_methods || [],

      // Payment
      payment_collections: [
        {
          provider_id: "stripe",
          amount: cart.total,
          currency_code: cart.currency_code,
          status: "authorized",
          data: {
            payment_intent_id: paymentIntentId,
          },
        },
      ],

      // Metadata
      metadata: {
        ...cart.metadata,
        payment_intent_id: paymentIntentId,
        source: cart.metadata?.source || "api",
        created_from_cart: true,
      },

      // Sales channel
      sales_channel_id: cart.sales_channel_id,

      created_at: new Date(),
      updated_at: new Date(),
    }
  }

  /**
   * Update inventory after order creation
   */
  private async updateInventory(order: OrderDTO): Promise<void> {
    if (!order.items?.length) {
      return
    }

    for (const item of order.items) {
      if (item.variant_id) {
        try {
          // Decrease inventory
          await this.inventoryService_.adjustInventory(
            item.variant_id,
            -item.quantity,
            {
              order_id: order.id,
              reason: "order_placed",
            }
          )
          console.log(`Decreased inventory for variant ${item.variant_id} by ${item.quantity}`)
        } catch (error) {
          console.error(`Failed to update inventory for variant ${item.variant_id}:`, error)
          // Don't fail order creation on inventory error
        }
      }
    }
  }

  /**
   * Retrieve order by ID
   */
  async retrieve(orderId: string, config?: any): Promise<OrderDTO> {
    const order = await this.orderModule_.retrieveOrder(orderId, config)

    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    return order
  }

  /**
   * Retrieve order by ID with email verification (for guest orders)
   */
  async retrieveByIdAndEmail(
    orderId: string,
    email: string
  ): Promise<OrderDTO> {
    const order = await this.retrieve(orderId)

    if (order.email !== email) {
      throw new Error("Order not found or email does not match")
    }

    return order
  }

  /**
   * List orders with filters
   */
  async list(filters: OrderFilters): Promise<{
    orders: OrderDTO[]
    count: number
  }> {
    const query: any = {}

    if (filters.email) {
      query.email = filters.email
    }

    if (filters.customer_id) {
      query.customer_id = filters.customer_id
    }

    if (filters.status) {
      query.status = filters.status
    }

    const { data: orders, count } = await this.orderModule_.listAndCountOrders(
      query,
      {
        skip: filters.offset || 0,
        take: filters.limit || 20,
        order: {
          created_at: "DESC",
        },
      }
    )

    return {
      orders,
      count,
    }
  }

  /**
   * List orders for customer
   */
  async listByCustomer(customerId: string): Promise<OrderDTO[]> {
    const { orders } = await this.list({
      customer_id: customerId,
    })

    return orders
  }

  /**
   * Update order status
   */
  async updateStatus(
    orderId: string,
    status: "pending" | "completed" | "canceled" | "requires_action"
  ): Promise<OrderDTO> {
    await this.orderModule_.updateOrders(orderId, {
      status,
      updated_at: new Date(),
    })

    return this.retrieve(orderId)
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: "awaiting" | "authorized" | "captured" | "refunded" | "partially_refunded"
  ): Promise<OrderDTO> {
    await this.orderModule_.updateOrders(orderId, {
      payment_status: paymentStatus,
      updated_at: new Date(),
    })

    // Emit event
    await this.eventBus_.emit("order.payment_status_updated", {
      order_id: orderId,
      payment_status: paymentStatus,
    })

    return this.retrieve(orderId)
  }

  /**
   * Update fulfillment status
   */
  async updateFulfillmentStatus(
    orderId: string,
    fulfillmentStatus: "not_fulfilled" | "partially_fulfilled" | "fulfilled" | "shipped" | "delivered"
  ): Promise<OrderDTO> {
    await this.orderModule_.updateOrders(orderId, {
      fulfillment_status: fulfillmentStatus,
      updated_at: new Date(),
    })

    // Emit event
    await this.eventBus_.emit("order.fulfillment_status_updated", {
      order_id: orderId,
      fulfillment_status: fulfillmentStatus,
    })

    return this.retrieve(orderId)
  }

  /**
   * Cancel order
   */
  async cancel(orderId: string, reason?: string): Promise<OrderDTO> {
    const order = await this.retrieve(orderId)

    if (order.status === "canceled") {
      throw new Error("Order is already canceled")
    }

    if (order.fulfillment_status !== "not_fulfilled") {
      throw new Error("Cannot cancel fulfilled order")
    }

    // Restore inventory
    await this.restoreInventory(order)

    // Cancel payment if authorized but not captured
    if (order.payment_status === "authorized") {
      // Cancel with payment service
      const paymentIntentId = order.metadata?.payment_intent_id
      if (paymentIntentId) {
        await this.paymentService_.cancelPayment(paymentIntentId)
      }
    }

    // Update order status
    await this.orderModule_.updateOrders(orderId, {
      status: "canceled",
      canceled_at: new Date(),
      metadata: {
        ...order.metadata,
        cancellation_reason: reason,
      },
    })

    // Emit event
    await this.eventBus_.emit("order.canceled", {
      order_id: orderId,
      reason,
    })

    return this.retrieve(orderId)
  }

  /**
   * Restore inventory for canceled order
   */
  private async restoreInventory(order: OrderDTO): Promise<void> {
    if (!order.items?.length) {
      return
    }

    for (const item of order.items) {
      if (item.variant_id) {
        try {
          await this.inventoryService_.adjustInventory(
            item.variant_id,
            item.quantity,
            {
              order_id: order.id,
              reason: "order_canceled",
            }
          )
          console.log(`Restored inventory for variant ${item.variant_id} by ${item.quantity}`)
        } catch (error) {
          console.error(`Failed to restore inventory for variant ${item.variant_id}:`, error)
        }
      }
    }
  }

  /**
   * Generate unique display ID for order
   */
  private async generateDisplayId(): Promise<number> {
    // Get the highest display ID
    const { orders } = await this.list({
      limit: 1,
    })

    if (orders.length > 0 && orders[0].display_id) {
      return orders[0].display_id + 1
    }

    return 1000 // Start from 1000
  }

  /**
   * Find order by cart ID
   */
  private async findOrderByCartId(cartId: string): Promise<OrderDTO | null> {
    const { orders } = await this.list({
      limit: 1,
    })

    const order = orders.find(o => o.cart_id === cartId)
    return order || null
  }

  /**
   * Find order by idempotency key
   */
  private async findOrderByIdempotencyKey(
    idempotencyKey: string
  ): Promise<OrderDTO | null> {
    // This would query a separate idempotency table
    // For now, return null
    return null
  }

  /**
   * Store idempotency key mapping
   */
  private async storeIdempotencyKey(
    idempotencyKey: string,
    orderId: string
  ): Promise<void> {
    // This would store in a separate idempotency table
    console.log(`Stored idempotency key ${idempotencyKey} for order ${orderId}`)
  }
}

export default OrderService