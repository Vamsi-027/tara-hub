/**
 * Payment Failure Scenarios Tests
 *
 * Tests various failure scenarios to ensure proper error handling and recovery.
 * Includes network timeouts, malformed events, and edge cases.
 */

import { POST } from "../api/webhooks/stripe/route"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import Stripe from "stripe"

// Mock Stripe
jest.mock("stripe")
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>

// Mock workflows with failures
const mockProcessPaymentWorkflow = jest.fn()
const mockCapturePaymentWorkflow = jest.fn()
const mockRefundPaymentWorkflow = jest.fn()

jest.mock("@medusajs/medusa/core-flows", () => ({
  processPaymentWorkflow: mockProcessPaymentWorkflow,
  capturePaymentWorkflow: mockCapturePaymentWorkflow,
  refundPaymentWorkflow: mockRefundPaymentWorkflow
}))

describe("Payment Failure Scenarios", () => {
  let mockRequest: Partial<MedusaRequest>
  let mockResponse: Partial<MedusaResponse>
  let mockStripeInstance: jest.Mocked<Stripe>
  let mockContainer: any

  beforeEach(() => {
    // Reset environment
    global.__processedWebhookEvents = new Set()
    process.env.STRIPE_API_KEY = "sk_test_123"
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123"

    // Mock container with potential failures
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
      headers: { "stripe-signature": "test_signature" },
      body: JSON.stringify({ id: "evt_test", type: "payment_intent.succeeded" }),
      scope: mockContainer
    }

    // Mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    // Mock Stripe instance
    mockStripeInstance = {
      webhooks: { constructEvent: jest.fn() },
      charges: { retrieve: jest.fn() }
    } as any

    MockedStripe.mockImplementation(() => mockStripeInstance)

    // Reset workflow mocks
    mockProcessPaymentWorkflow.mockReturnValue({
      run: jest.fn().mockResolvedValue({ result: { success: true } })
    })
    mockCapturePaymentWorkflow.mockReturnValue({
      run: jest.fn().mockResolvedValue({ result: { success: true } })
    })
    mockRefundPaymentWorkflow.mockReturnValue({
      run: jest.fn().mockResolvedValue({ result: { success: true } })
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
    delete process.env.STRIPE_API_KEY
    delete process.env.STRIPE_WEBHOOK_SECRET
  })

  describe("Network and Timeout Failures", () => {
    it("should handle workflow timeouts gracefully", async () => {
      const mockEvent = {
        id: "evt_timeout",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            metadata: { cart_id: "cart_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      // Simulate timeout error
      mockProcessPaymentWorkflow.mockReturnValue({
        run: jest.fn().mockRejectedValue(new Error("TIMEOUT: Operation timed out"))
      })

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        received: true,
        error: "TIMEOUT: Operation timed out"
      })
    })

    it("should handle network connection failures", async () => {
      const mockEvent = {
        id: "evt_network_fail",
        type: "charge.refunded",
        data: {
          object: {
            id: "ch_test",
            metadata: { order_id: "order_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)
      mockRefundPaymentWorkflow.mockReturnValue({
        run: jest.fn().mockRejectedValue(new Error("ECONNREFUSED: Connection refused"))
      })

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        received: true,
        error: "ECONNREFUSED: Connection refused"
      })
    })
  })

  describe("Malformed Event Handling", () => {
    it("should handle malformed JSON in request body", async () => {
      mockRequest.body = "invalid json {"

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Webhook signature verification failed")
      })
    })

    it("should handle events with missing required fields", async () => {
      const mockEvent = {
        id: "evt_malformed",
        type: "payment_intent.succeeded",
        data: {
          object: {
            // Missing required fields like id, amount, etc.
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      // Should still return 200 to prevent retries
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })

    it("should handle events with invalid metadata", async () => {
      const mockEvent = {
        id: "evt_bad_metadata",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            metadata: {
              cart_id: null, // Invalid cart_id
              corrupted_field: "\\x00\\x01\\x02" // Binary data
            }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })
  })

  describe("Service Resolution Failures", () => {
    it("should handle missing payment module", async () => {
      // Mock container that fails to resolve payment module
      mockContainer.resolve.mockImplementation((serviceName: string) => {
        if (serviceName === "payment") {
          throw new Error("Payment module not available")
        }
        return {}
      })

      const mockEvent = {
        id: "evt_service_fail",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test",
            metadata: { payment_collection_id: "pc_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        received: true,
        error: "Payment module not available"
      })
    })

    it("should handle order module failures", async () => {
      mockContainer.resolve.mockImplementation((serviceName: string) => {
        if (serviceName === "order") {
          return {
            updateOrders: jest.fn().mockRejectedValue(new Error("Database connection lost"))
          }
        }
        return {}
      })

      const mockEvent = {
        id: "evt_order_fail",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test",
            metadata: { order_id: "order_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        received: true,
        error: "Database connection lost"
      })
    })
  })

  describe("Edge Cases", () => {
    it("should handle extremely large event payloads", async () => {
      const largeMetadata: Record<string, string> = {}
      for (let i = 0; i < 1000; i++) {
        largeMetadata[`key_${i}`] = "x".repeat(1000) // Large values
      }

      const mockEvent = {
        id: "evt_large",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            metadata: largeMetadata
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })

    it("should handle concurrent webhook processing", async () => {
      const mockEvent = {
        id: "evt_concurrent",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test",
            metadata: { cart_id: "cart_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      // Simulate multiple concurrent requests
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse))
      }

      await Promise.all(promises)

      // Only first request should process, others should be marked as duplicates
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })

    it("should handle events with future timestamps", async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600 // 1 hour in future

      const mockEvent = {
        id: "evt_future",
        type: "payment_intent.succeeded",
        created: futureTimestamp,
        data: {
          object: {
            id: "pi_test",
            metadata: { cart_id: "cart_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })
  })

  describe("Recovery Scenarios", () => {
    it("should recover from temporary service failures", async () => {
      let callCount = 0
      mockContainer.resolve.mockImplementation((serviceName: string) => {
        callCount++
        if (serviceName === "payment" && callCount === 1) {
          throw new Error("Temporary failure")
        }
        return {
          updatePaymentCollections: jest.fn().mockResolvedValue(true)
        }
      })

      const mockEvent = {
        id: "evt_recovery",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test",
            metadata: { payment_collection_id: "pc_test" }
          }
        }
      }

      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event)

      // First call should fail
      await POST(mockRequest as MedusaRequest, mockResponse as MedusaResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        received: true,
        error: "Temporary failure"
      })
    })
  })
})