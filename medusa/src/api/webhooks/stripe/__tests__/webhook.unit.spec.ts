/**
 * Stripe Webhook Handler Unit Tests
 *
 * Tests webhook signature validation, event routing, and error handling.
 * Uses Medusa v2 test utilities and mocks.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { POST } from "../route"
import Stripe from "stripe"

// Mock Stripe
jest.mock("stripe")
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>

// Mock Medusa workflows
jest.mock("@medusajs/medusa/core-flows", () => ({
  processPaymentWorkflow: jest.fn(() => ({
    run: jest.fn().mockResolvedValue({ result: { success: true } })
  })),
  capturePaymentWorkflow: jest.fn(() => ({
    run: jest.fn().mockResolvedValue({ result: { success: true } })
  })),
  refundPaymentWorkflow: jest.fn(() => ({
    run: jest.fn().mockResolvedValue({ result: { success: true } })
  }))
}))

describe("Stripe Webhook Handler", () => {
  let mockRequest: Partial<MedusaRequest>
  let mockResponse: Partial<MedusaResponse>
  let mockStripeInstance: jest.Mocked<Stripe>
  let mockContainer: any

  beforeEach(() => {
    // Reset global processed events
    global.__processedWebhookEvents = new Set()

    // Mock container with service resolution
    mockContainer = {
      resolve: jest.fn((serviceName: string) => {
        switch (serviceName) {
          case "payment":
            return {
              updatePaymentCollections: jest.fn().mockResolvedValue(true)
            }
          case "order":
            return {
              updateOrders: jest.fn().mockResolvedValue(true),
              cancelOrder: jest.fn().mockResolvedValue(true)
            }
          default:
            return {}
        }
      })
    }

    // Mock request
    mockRequest = {
      headers: {
        "stripe-signature": "test_signature"
      },
      body: Buffer.from(
        JSON.stringify({
          id: "evt_test_webhook",
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: "pi_test_payment_intent",
              amount_received: 2000,
              currency: "usd",
              metadata: {
                cart_id: "cart_test",
                payment_session_id: "ps_test"
              }
            }
          }
        }),
        "utf8"
      ),
      scope: mockContainer
    }

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    // Mock Stripe instance
    mockStripeInstance = {
      webhooks: {
        constructEvent: jest.fn()
      },
      charges: {
        retrieve: jest.fn()
      }
    } as any

    // Mock the Stripe constructor to return our mocked instance
    MockedStripe.mockImplementation(() => mockStripeInstance as any)

    const defaultEvent = JSON.parse(mockRequest.body.toString('utf8')) as Stripe.Event
    mockStripeInstance.webhooks.constructEvent.mockReturnValue(defaultEvent)

    // Set environment variables
    process.env.STRIPE_API_KEY = "sk_test_123"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123"
  })

  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.STRIPE_API_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
  })

  describe("Signature Validation", () => {
    it("should reject requests without signature", async () => {
      mockRequest.headers = {}

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Missing webhook signature"
      })
    })

    it("should reject requests when webhook secret not configured", async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Webhook secret not configured"
      })
    })

    it("should reject requests with invalid signature", async () => {
      const error = new Error("Invalid signature")
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw error
      })

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Webhook signature verification failed: Invalid signature"
      })
    })

    it("should validate signatures correctly", async () => {
      const mockEvent = {
        id: "evt_test_webhook",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_payment_intent",
            amount_received: 2000,
            currency: "usd",
            metadata: {
              cart_id: "cart_test",
              payment_session_id: "ps_test"
            }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        "test_signature",
        "whsec_test_123"
      )
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })
  })

  describe("Idempotency", () => {
    it("should process new events", async () => {
      const mockEvent = {
        id: "evt_new_event",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_payment_intent",
            amount_received: 2000,
            currency: "usd",
            metadata: { cart_id: "cart_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true })
    })

    it("should skip duplicate events", async () => {
      const mockEvent = {
        id: "evt_duplicate",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      // First call
      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      // Reset mocks for second call
      jest.clearAllMocks()

      // Second call with same event ID
      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        received: true,
        duplicate: true
      })
    })

    it("should clean up old events when limit exceeded", async () => {
      // Add 1001 events to trigger cleanup
      const processedEvents = new Set()
      for (let i = 0; i < 1001; i++) {
        processedEvents.add(`evt_${i}`)
      }
      global.__processedWebhookEvents = processedEvents

      const mockEvent = {
        id: "evt_new",
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test" } }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      // Should have cleaned up to 1000 events plus the new one
      expect(global.__processedWebhookEvents.size).toBe(1001)
    })
  })

  describe("Event Routing", () => {
    it("should route payment_intent.succeeded to processPaymentWorkflow", async () => {
      const mockEvent = {
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            amount_received: 2000,
            currency: "usd",
            metadata: {
              cart_id: "cart_test",
              payment_session_id: "ps_test"
            }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      const { processPaymentWorkflow } = require("@medusajs/medusa/core-flows")

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(processPaymentWorkflow).toHaveBeenCalledWith(mockContainer)
      expect(processPaymentWorkflow().run).toHaveBeenCalledWith({
        input: {
          action: "captured",
          data: {
            session_id: "ps_test",
            amount: 2000,
            currency_code: "USD",
            payment_intent_id: "pi_test"
          }
        }
      })
    })

    it("should handle payment_intent.payment_failed events", async () => {
      const mockEvent = {
        id: "evt_test",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test",
            metadata: {
              payment_collection_id: "pc_test",
              order_id: "order_test"
            },
            last_payment_error: {
              message: "Card declined"
            }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      const paymentModule = mockContainer.resolve("payment")
      const orderModule = mockContainer.resolve("order")

      expect(paymentModule.updatePaymentCollections).toHaveBeenCalledWith([{
        id: "pc_test",
        status: "not_paid"
      }])

      expect(orderModule.updateOrders).toHaveBeenCalledWith([{
        id: "order_test",
        status: "requires_action"
      }])
    })

    it("should handle unrecognized event types gracefully", async () => {
      const mockEvent = {
        id: "evt_test",
        type: "unknown.event.type",
        data: { object: {} }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({ received: true })
    })
  })

  describe("Error Handling", () => {
    it("should handle workflow failures gracefully", async () => {
      const mockEvent = {
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            metadata: { cart_id: "cart_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      const { processPaymentWorkflow } = require("@medusajs/medusa/core-flows")
      processPaymentWorkflow().run.mockRejectedValue(new Error("Workflow failed"))

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      // Should still return 200 to prevent Stripe retries
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        received: true,
        error: "Workflow failed"
      })
    })

    it("should handle missing required metadata", async () => {
      const mockEvent = {
        id: "evt_test",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            metadata: {} // Missing cart_id and order_id
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      // Should still return 200 even with missing metadata
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })
  })
})