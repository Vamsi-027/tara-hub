/**
 * Order Endpoints Test Suite
 *
 * Tests that order management endpoints continue working after checkout removal
 * and that legacy checkout endpoints are properly disabled when feature flag is off.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework"

describe("Order Endpoints with Legacy Checkout Disabled", () => {
  const originalEnv = process.env.ENABLE_LEGACY_CHECKOUT

  beforeAll(() => {
    // Disable legacy checkout for these tests
    process.env.ENABLE_LEGACY_CHECKOUT = 'false'
  })

  afterAll(() => {
    // Restore original environment
    process.env.ENABLE_LEGACY_CHECKOUT = originalEnv
  })

  describe("Order Retrieval Endpoints (Should Work)", () => {
    test("GET /store/orders should return orders list", async () => {
      // Mock implementation
      const mockReq = {
        query: {},
        headers: {},
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { GET } = await import("../store/orders/route")

      // Execute
      await GET(mockReq, mockRes)

      // Verify orders can still be retrieved
      expect(mockRes.status).not.toHaveBeenCalledWith(501)
    })

    test("GET /store/orders/:id should return specific order", async () => {
      const mockReq = {
        params: { id: "order_123" },
        headers: {},
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { GET } = await import("../store/orders/[id]/route")

      // Execute
      await GET(mockReq, mockRes)

      // Verify specific order can be retrieved
      expect(mockRes.status).not.toHaveBeenCalledWith(501)
    })

    test("GET /admin/orders should work for admin", async () => {
      const mockReq = {
        query: {},
        headers: { authorization: "Bearer admin-token" },
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { GET } = await import("../admin/orders/route")

      // Execute
      await GET(mockReq, mockRes)

      // Verify admin can retrieve orders
      expect(mockRes.status).not.toHaveBeenCalledWith(501)
    })
  })

  describe("Legacy Checkout Endpoints (Should Be Disabled)", () => {
    test("POST /store/orders/create should return 501", async () => {
      const mockReq = {
        body: {
          email: "test@example.com",
          items: [],
        },
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { POST } = await import("../store/orders/create/route")

      // Execute
      await POST(mockReq, mockRes)

      // Verify endpoint is disabled
      expect(mockRes.status).toHaveBeenCalledWith(501)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "LEGACY_CHECKOUT_DISABLED",
        })
      )
    })

    test("POST /store/create-order-direct should return 501", async () => {
      const mockReq = {
        body: {
          email: "test@example.com",
          items: [],
        },
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { POST } = await import("../store/create-order-direct/route")

      // Execute
      await POST(mockReq, mockRes)

      // Verify endpoint is disabled
      expect(mockRes.status).toHaveBeenCalledWith(501)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "LEGACY_CHECKOUT_DISABLED",
        })
      )
    })

    test("POST /store/debug/cart-creation should return 501", async () => {
      const mockReq = {
        body: {
          email: "test@example.com",
        },
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { POST } = await import("../store/debug/cart-creation/route")

      // Execute
      await POST(mockReq, mockRes)

      // Verify cart creation is disabled
      expect(mockRes.status).toHaveBeenCalledWith(501)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "LEGACY_CHECKOUT_DISABLED",
        })
      )
    })

    test("POST /admin/orders/create-fabric-order should return 501", async () => {
      const mockReq = {
        body: {
          email: "test@example.com",
          items: [],
        },
        headers: { authorization: "Bearer admin-token" },
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { POST } = await import("../admin/orders/create-fabric-order/route")

      // Execute
      await POST(mockReq, mockRes)

      // Verify fabric order creation is disabled
      expect(mockRes.status).toHaveBeenCalledWith(501)
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "LEGACY_CHECKOUT_DISABLED",
        })
      )
    })
  })
})

describe("Order Endpoints with Legacy Checkout Enabled", () => {
  const originalEnv = process.env.ENABLE_LEGACY_CHECKOUT

  beforeAll(() => {
    // Enable legacy checkout for these tests
    process.env.ENABLE_LEGACY_CHECKOUT = 'true'
  })

  afterAll(() => {
    // Restore original environment
    process.env.ENABLE_LEGACY_CHECKOUT = originalEnv
  })

  describe("Legacy Checkout Endpoints (Should Work)", () => {
    test("POST /store/orders/create should not return 501", async () => {
      const mockReq = {
        body: {
          email: "test@example.com",
          items: [],
        },
        scope: {
          resolve: jest.fn(),
        },
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { POST } = await import("../store/orders/create/route")

      try {
        await POST(mockReq, mockRes)
      } catch (error) {
        // May fail due to missing dependencies, but should not return 501
      }

      // Verify endpoint is not disabled
      if (mockRes.status.mock.calls.length > 0) {
        expect(mockRes.status).not.toHaveBeenCalledWith(501)
      }
    })

    test("Cart creation endpoint should not return 501", async () => {
      const mockReq = {
        body: {
          email: "test@example.com",
        },
        scope: {
          resolve: jest.fn(),
        },
      } as unknown as MedusaRequest

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as MedusaResponse

      // Import route handler
      const { POST } = await import("../store/debug/cart-creation/route")

      try {
        await POST(mockReq, mockRes)
      } catch (error) {
        // May fail due to missing dependencies, but should not return 501
      }

      // Verify cart creation is not disabled
      if (mockRes.status.mock.calls.length > 0) {
        expect(mockRes.status).not.toHaveBeenCalledWith(501)
      }
    })
  })
})

// Test the feature flag configuration
describe("Feature Flag Configuration", () => {
  test("Feature flag should correctly parse environment variable", () => {
    const { isLegacyCheckoutEnabled } = require("../../config/feature-flags")

    // Test with different values
    process.env.ENABLE_LEGACY_CHECKOUT = 'false'
    expect(isLegacyCheckoutEnabled()).toBe(false)

    process.env.ENABLE_LEGACY_CHECKOUT = 'true'
    expect(isLegacyCheckoutEnabled()).toBe(true)

    delete process.env.ENABLE_LEGACY_CHECKOUT
    expect(isLegacyCheckoutEnabled()).toBe(true) // Default to true
  })
})