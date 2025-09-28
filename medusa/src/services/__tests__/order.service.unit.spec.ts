/**
 * Order Service Unit Tests
 *
 * Tests order creation and cancellation flows with Medusa v2 payment integration.
 * Validates that payment service dependencies have been properly removed.
 */

import OrderService from "../order.service"
import { Modules } from "@medusajs/framework/utils"

describe("OrderService", () => {
  let orderService: OrderService
  let mockContainer: any
  let mockOrderModule: any
  let mockPaymentModule: any
  let mockInventoryService: any
  let mockCartService: any

  beforeEach(() => {
    // Mock payment module
    mockPaymentModule = {
      listPaymentCollections: jest.fn(),
      updatePaymentCollections: jest.fn()
    }

    // Mock order module
    mockOrderModule = {
      createOrders: jest.fn(),
      updateOrders: jest.fn(),
      listOrders: jest.fn()
    }

    // Mock inventory service
    mockInventoryService = {
      adjustInventory: jest.fn(),
      listInventoryItems: jest.fn()
    }

    // Mock cart service
    mockCartService = {
      retrieve: jest.fn(),
      validateForCheckout: jest.fn()
    }

    // Mock container
    mockContainer = {
      [Modules.ORDER]: mockOrderModule,
      [Modules.PAYMENT]: mockPaymentModule,
      [Modules.INVENTORY]: mockInventoryService,
      resolve: jest.fn((serviceName: string) => {
        switch (serviceName) {
          case "cartService":
            return mockCartService
          default:
            return {}
        }
      })
    }

    // Create order service instance
    orderService = new OrderService(mockContainer)

    // Mock CartService constructor to use our mock
    jest.doMock("../cart.service", () => {
      return jest.fn().mockImplementation(() => mockCartService)
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  describe("createFromCart", () => {
    it("should verify payment status before creating order", async () => {
      const input = {
        cart_id: "cart_test",
        payment_intent_id: "pi_test",
        idempotency_key: "key_test"
      }

      // Mock cart validation success
      mockCartService.validateForCheckout.mockResolvedValue({
        valid: true,
        errors: []
      })

      // Mock payment collection with authorized status
      mockPaymentModule.listPaymentCollections.mockResolvedValue([
        {
          id: "pc_test",
          status: "authorized",
          cart_id: "cart_test"
        }
      ])

      // Mock cart retrieval
      mockCartService.retrieve.mockResolvedValue({
        id: "cart_test",
        email: "test@example.com",
        currency_code: "usd",
        items: [],
        total: 2000
      })

      // Mock order creation
      mockOrderModule.createOrders.mockResolvedValue({
        id: "order_test",
        cart_id: "cart_test",
        payment_status: "authorized"
      })

      const result = await orderService.createFromCart(input)

      // Verify payment module was called correctly
      expect(mockPaymentModule.listPaymentCollections).toHaveBeenCalledWith({
        cart_id: "cart_test"
      })

      // Verify order was created
      expect(mockOrderModule.createOrders).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it("should throw error when payment not authorized", async () => {
      const input = {
        cart_id: "cart_test",
        payment_intent_id: "pi_test"
      }

      // Mock cart validation success
      mockCartService.validateForCheckout.mockResolvedValue({
        valid: true,
        errors: []
      })

      // Mock payment collection with non-authorized status
      mockPaymentModule.listPaymentCollections.mockResolvedValue([
        {
          id: "pc_test",
          status: "pending",
          cart_id: "cart_test"
        }
      ])

      await expect(orderService.createFromCart(input)).rejects.toThrow(
        "Payment not authorized. Status: pending"
      )
    })

    it("should throw error when no payment collection found", async () => {
      const input = {
        cart_id: "cart_test",
        payment_intent_id: "pi_test"
      }

      // Mock cart validation success
      mockCartService.validateForCheckout.mockResolvedValue({
        valid: true,
        errors: []
      })

      // Mock no payment collections
      mockPaymentModule.listPaymentCollections.mockResolvedValue([])

      await expect(orderService.createFromCart(input)).rejects.toThrow(
        "No payment collection found for cart cart_test"
      )
    })
  })

  describe("cancel", () => {
    it("should cancel payment collection when order has authorized payment", async () => {
      const orderId = "order_test"

      // Mock order retrieval
      jest.spyOn(orderService, 'retrieve').mockResolvedValue({
        id: orderId,
        payment_status: "authorized",
        metadata: { payment_intent_id: "pi_test" }
      } as any)

      // Mock inventory restoration
      jest.spyOn(orderService as any, 'restoreInventory').mockResolvedValue(undefined)

      // Mock payment collection
      mockPaymentModule.listPaymentCollections.mockResolvedValue([
        {
          id: "pc_test",
          status: "authorized",
          order_id: orderId
        }
      ])

      // Mock payment collection update
      mockPaymentModule.updatePaymentCollections.mockResolvedValue(true)

      // Mock order update
      mockOrderModule.updateOrders.mockResolvedValue(true)

      await orderService.cancel(orderId, "Test cancellation")

      // Verify payment collection was canceled
      expect(mockPaymentModule.listPaymentCollections).toHaveBeenCalledWith({
        order_id: orderId
      })

      expect(mockPaymentModule.updatePaymentCollections).toHaveBeenCalledWith([{
        id: "pc_test",
        status: "canceled"
      }])

      // Verify order was updated
      expect(mockOrderModule.updateOrders).toHaveBeenCalledWith(orderId, {
        status: "canceled",
        canceled_at: expect.any(Date),
        metadata: expect.any(Object)
      })
    })

    it("should skip payment cancellation when no payment collection exists", async () => {
      const orderId = "order_test"

      // Mock order retrieval
      jest.spyOn(orderService, 'retrieve').mockResolvedValue({
        id: orderId,
        payment_status: "authorized",
        metadata: {}
      } as any)

      // Mock inventory restoration
      jest.spyOn(orderService as any, 'restoreInventory').mockResolvedValue(undefined)

      // Mock no payment collections
      mockPaymentModule.listPaymentCollections.mockResolvedValue([])

      // Mock order update
      mockOrderModule.updateOrders.mockResolvedValue(true)

      await orderService.cancel(orderId, "Test cancellation")

      // Verify payment collection update was not called
      expect(mockPaymentModule.updatePaymentCollections).not.toHaveBeenCalled()

      // Verify order was still updated
      expect(mockOrderModule.updateOrders).toHaveBeenCalled()
    })
  })

  describe("Service Initialization", () => {
    it("should initialize without payment service dependency", () => {
      // Verify service initializes properly
      expect(orderService).toBeDefined()
      expect(orderService['orderModule_']).toBe(mockOrderModule)
      expect(orderService['container_']).toBe(mockContainer)

      // Verify no payment service property exists
      expect(orderService['paymentService_']).toBeUndefined()
    })

    it("should have access to payment module through container", () => {
      const paymentModule = orderService['container_'][Modules.PAYMENT]
      expect(paymentModule).toBe(mockPaymentModule)
    })
  })
})