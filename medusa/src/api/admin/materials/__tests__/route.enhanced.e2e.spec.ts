/**
 * Enhanced Materials API E2E Tests
 *
 * Uses the new test infrastructure with:
 * - Proper Medusa v2 patterns
 * - Neon DB optimizations
 * - Transaction-based isolation
 * - Performance monitoring
 */

import request from "supertest";
import express from "express";
import { useE2ETestSuite, measureTestPerformance } from "../../../test-utils/e2e-test-setup";
import { GET as LIST_GET } from "../route";
import { GET as ID_GET } from "../[id]/route";

describe("Materials API E2E (Enhanced)", () => {
  const testSuite = useE2ETestSuite();

  // Test data setup
  let testMaterials: any[] = [];
  let app: express.Express;

  beforeAll(async () => {
    // Setup test server
    app = createTestServer();

    // Setup test scenario
    const scenario = await testSuite.setupScenario('basicMaterials');
    testMaterials = scenario.materials;
  });

  describe("Performance & Health", () => {
    it("should respond to health check quickly", async () => {
      await measureTestPerformance(async () => {
        const response = await request(app)
          .get("/health")
          .expect(200);

        expect(response.body.status).toBe("ok");
      }, "Health check", 100); // Expect under 100ms
    });
  });

  describe("GET /admin/materials", () => {
    it("should return paginated materials list", async () => {
      const response = await measureTestPerformance(async () => {
        return await request(app)
          .get("/admin/materials")
          .set("x-admin", "1")
          .expect(200);
      }, "Materials list query");

      expect(response.body).toHaveProperty("materials");
      expect(response.body).toHaveProperty("pagination");
      expect(Array.isArray(response.body.materials)).toBe(true);

      // Verify test materials are included
      const materialNames = response.body.materials.map((m: any) => m.name);
      expect(materialNames).toEqual(
        expect.arrayContaining(["Test Cotton", "Test Linen", "Test Wool"])
      );
    });

    it("should support search with proper performance", async () => {
      const response = await measureTestPerformance(async () => {
        return await request(app)
          .get("/admin/materials?q=cotton")
          .set("x-admin", "1")
          .expect(200);
      }, "Materials search query", 500); // Expect under 500ms

      const materials = response.body.materials;
      expect(materials.length).toBeGreaterThan(0);

      // All results should contain "cotton" (case insensitive)
      materials.forEach((material: any) => {
        expect(material.name.toLowerCase()).toContain("cotton");
      });
    });

    it("should handle pagination correctly", async () => {
      const response = await request(app)
        .get("/admin/materials?limit=2&offset=0")
        .set("x-admin", "1")
        .expect(200);

      expect(response.body.materials.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty("total");
      expect(response.body.pagination).toHaveProperty("limit");
      expect(response.body.pagination).toHaveProperty("offset");
    });
  });

  describe("GET /admin/materials/:id", () => {
    it("should return specific material", async () => {
      const materialId = testMaterials[0].id;

      const response = await measureTestPerformance(async () => {
        return await request(app)
          .get(`/admin/materials/${materialId}`)
          .set("x-admin", "1")
          .expect(200);
      }, "Single material query");

      expect(response.body.material).toHaveProperty("id", materialId);
      expect(response.body.material).toHaveProperty("name");
      expect(response.body.material).toHaveProperty("type");
    });

    it("should return 404 for non-existent material", async () => {
      const nonExistentId = `${testSuite.getPrefix()}_non_existent`;

      await request(app)
        .get(`/admin/materials/${nonExistentId}`)
        .set("x-admin", "1")
        .expect(404);
    });
  });

  describe("Authentication", () => {
    it("should reject unauthenticated requests", async () => {
      await request(app)
        .get("/admin/materials")
        .expect(401);
    });
  });

  describe("Database Operations", () => {
    it("should handle concurrent requests efficiently", async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .get(`/admin/materials?q=test&offset=${i * 2}`)
          .set("x-admin", "1")
      );

      await measureTestPerformance(async () => {
        const responses = await Promise.all(concurrentRequests);
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      }, "Concurrent requests", 1000); // Expect under 1s total
    });

    it("should maintain data consistency", async () => {
      // Verify test data isolation
      const pool = testSuite.getPool();
      const prefix = testSuite.getPrefix();

      const result = await pool.query(
        "SELECT COUNT(*) as count FROM materials WHERE id LIKE $1",
        [`${prefix}%`]
      );

      expect(parseInt(result.rows[0].count)).toBe(testMaterials.length);
    });
  });

  // Helper function to create test server
  function createTestServer(): express.Express {
    const app = express();
    app.use(express.json());

    // Simple health check
    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Auth middleware
    app.use((req, res, next) => {
      if (req.headers["x-admin"] === "1") {
        (req as any).auth = { actor_type: "user" };
        (req as any).user = { type: "admin" };
      }
      next();
    });

    // Mock services
    const mockServices = createMockServices();
    app.use((req, res, next) => {
      (req as any).scope = {
        resolve: (key: string) => mockServices[key] || null,
      };
      next();
    });

    // Routes
    app.get("/admin/materials", (req, res) => LIST_GET(req as any, res));
    app.get("/admin/materials/:id", (req, res) => ID_GET(req as any, res));

    return app;
  }

  function createMockServices() {
    const pool = testSuite.getPool();

    return {
      materialsService: {
        async listWithMeta({ limit = 20, offset = 0, q }: any) {
          const take = Math.min(Math.max(limit, 1), 100);
          const skip = Math.max(offset, 0);

          let whereClause = "";
          const params: any[] = [];

          if (q) {
            whereClause = "WHERE name ILIKE $1";
            params.push(`%${q}%`);
          }

          // Count query
          const countResult = await pool.query(
            `SELECT COUNT(*)::int as count FROM materials ${whereClause}`,
            params
          );
          const total = countResult.rows[0]?.count || 0;

          // Data query
          const dataParams = [...params, take, skip];
          const dataResult = await pool.query(
            `SELECT id, name, code, type, properties, created_at, updated_at
             FROM materials ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
            dataParams
          );

          return {
            data: dataResult.rows,
            metadata: {
              total,
              limit: take,
              offset: skip,
              hasMore: skip + take < total,
            },
          };
        },

        async retrieve(id: string) {
          const result = await pool.query(
            "SELECT id, name, code, type, properties, created_at, updated_at FROM materials WHERE id = $1",
            [id]
          );

          if (result.rows.length === 0) {
            throw new Error("Material not found");
          }

          return result.rows[0];
        },
      },

      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    };
  }
});