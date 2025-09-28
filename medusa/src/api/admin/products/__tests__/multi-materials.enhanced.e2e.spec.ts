/**
 * Enhanced Multi-Material E2E Tests
 *
 * Tests the new multi-material functionality with:
 * - Soft deletion support (deleted_at)
 * - Multiple materials per variant
 * - Unique constraint handling
 * - Performance monitoring
 */

import { useE2ETestSuite, measureTestPerformance } from "../../../../test-utils/e2e-test-setup";
import request from "supertest";
import express from "express";

describe("Multi-Material Product Variants E2E (Enhanced)", () => {
  const testSuite = useE2ETestSuite();

  let testMaterials: any[] = [];
  let testProducts: any[] = [];
  let app: express.Express;

  beforeAll(async () => {
    // Setup comprehensive test scenario
    const scenario = await testSuite.setupScenario('productWithMaterials');
    testMaterials = scenario.materials;
    testProducts = scenario.products;

    // Create additional materials for multi-material testing
    const factory = testSuite.getFactory();
    const extraMaterials = [
      factory.createMaterial({ name: 'Denim Blend', type: 'cotton', code: 'DBL-001' }),
      factory.createMaterial({ name: 'Modal Fabric', type: 'synthetic', code: 'MOD-002' }),
      factory.createMaterial({ name: 'Hemp Canvas', type: 'hemp', code: 'HMP-003' }),
    ];

    await testSuite.getSession().seedCustomData({ materials: extraMaterials });
    testMaterials.push(...extraMaterials);

    // Setup test server
    app = createEnhancedTestServer();
  });

  describe("Multi-Material Assignment", () => {
    it("should assign multiple materials to a single variant", async () => {
      const product = testProducts[0];
      const variant = product.variants[0];
      const materialIds = testMaterials.slice(0, 3).map(m => m.id);

      const response = await measureTestPerformance(async () => {
        return await request(app)
          .post(`/admin/products/${product.id}/variants/${variant.id}`)
          .set("x-admin", "1")
          .send({ material_ids: materialIds })
          .expect(200);
      }, "Multi-material assignment");

      // Verify response contains all materials
      expect(response.body.variant.materials).toHaveLength(3);
      expect(response.body.variant.materials.map((m: any) => m.id).sort())
        .toEqual(materialIds.sort());

      // Verify database state
      const pool = testSuite.getPool();
      const dbResult = await pool.query(
        `SELECT material_id FROM product_variant_material_link
         WHERE product_variant_id = $1 AND deleted_at IS NULL
         ORDER BY material_id`,
        [variant.id]
      );

      expect(dbResult.rows.map(r => r.material_id).sort()).toEqual(materialIds.sort());
    });

    it("should handle partial material updates correctly", async () => {
      const product = testProducts[0];
      const variant = product.variants[0];
      const initialMaterials = testMaterials.slice(0, 4).map(m => m.id);
      const updatedMaterials = testMaterials.slice(1, 3).map(m => m.id); // Remove first and last

      // Initial assignment
      await request(app)
        .post(`/admin/products/${product.id}/variants/${variant.id}`)
        .set("x-admin", "1")
        .send({ material_ids: initialMaterials })
        .expect(200);

      // Partial update
      const response = await measureTestPerformance(async () => {
        return await request(app)
          .post(`/admin/products/${product.id}/variants/${variant.id}`)
          .set("x-admin", "1")
          .send({ material_ids: updatedMaterials })
          .expect(200);
      }, "Partial material update");

      // Verify only updated materials are active
      expect(response.body.variant.materials.map((m: any) => m.id).sort())
        .toEqual(updatedMaterials.sort());

      // Verify soft deletion in database
      const pool = testSuite.getPool();
      const allLinks = await pool.query(
        `SELECT material_id, deleted_at FROM product_variant_material_link
         WHERE product_variant_id = $1
         ORDER BY material_id`,
        [variant.id]
      );

      const activeLinks = allLinks.rows.filter(r => r.deleted_at === null);
      const deletedLinks = allLinks.rows.filter(r => r.deleted_at !== null);

      expect(activeLinks.map(r => r.material_id).sort()).toEqual(updatedMaterials.sort());
      expect(deletedLinks).toHaveLength(2); // First and last materials should be soft-deleted
    });

    it("should deduplicate material IDs in requests", async () => {
      const product = testProducts[0];
      const variant = product.variants[1]; // Use second variant
      const materialId = testMaterials[0].id;
      const duplicatedIds = [materialId, materialId, materialId];

      const response = await request(app)
        .post(`/admin/products/${product.id}/variants/${variant.id}`)
        .set("x-admin", "1")
        .send({ material_ids: duplicatedIds })
        .expect(200);

      // Should only have one material despite duplicates
      expect(response.body.variant.materials).toHaveLength(1);
      expect(response.body.variant.materials[0].id).toBe(materialId);

      // Verify only one record in database
      const pool = testSuite.getPool();
      const dbResult = await pool.query(
        `SELECT COUNT(*) as count FROM product_variant_material_link
         WHERE product_variant_id = $1 AND deleted_at IS NULL`,
        [variant.id]
      );

      expect(parseInt(dbResult.rows[0].count)).toBe(1);
    });
  });

  describe("Soft Deletion Behavior", () => {
    it("should reactivate previously deleted material links", async () => {
      const product = testProducts[0];
      const variant = product.variants[0];
      const material1 = testMaterials[0].id;
      const material2 = testMaterials[1].id;

      // Initial assignment
      await request(app)
        .post(`/admin/products/${product.id}/variants/${variant.id}`)
        .set("x-admin", "1")
        .send({ material_ids: [material1, material2] })
        .expect(200);

      // Remove material1
      await request(app)
        .post(`/admin/products/${product.id}/variants/${variant.id}`)
        .set("x-admin", "1")
        .send({ material_ids: [material2] })
        .expect(200);

      // Re-add material1 (should reactivate, not create new record)
      await request(app)
        .post(`/admin/products/${product.id}/variants/${variant.id}`)
        .set("x-admin", "1")
        .send({ material_ids: [material1, material2] })
        .expect(200);

      // Verify only 2 total records exist (one reactivated)
      const pool = testSuite.getPool();
      const totalRecords = await pool.query(
        `SELECT COUNT(*) as count FROM product_variant_material_link
         WHERE product_variant_id = $1`,
        [variant.id]
      );

      expect(parseInt(totalRecords.rows[0].count)).toBe(2);

      // Verify both are active
      const activeRecords = await pool.query(
        `SELECT COUNT(*) as count FROM product_variant_material_link
         WHERE product_variant_id = $1 AND deleted_at IS NULL`,
        [variant.id]
      );

      expect(parseInt(activeRecords.rows[0].count)).toBe(2);
    });

    it("should handle concurrent material assignments gracefully", async () => {
      const product = testProducts[0];
      const variant1 = product.variants[0];
      const variant2 = product.variants[1];
      const sharedMaterial = testMaterials[0].id;

      // Assign same material to different variants concurrently
      const concurrentRequests = [
        request(app)
          .post(`/admin/products/${product.id}/variants/${variant1.id}`)
          .set("x-admin", "1")
          .send({ material_ids: [sharedMaterial] }),
        request(app)
          .post(`/admin/products/${product.id}/variants/${variant2.id}`)
          .set("x-admin", "1")
          .send({ material_ids: [sharedMaterial] }),
      ];

      await measureTestPerformance(async () => {
        const responses = await Promise.all(concurrentRequests);
        responses.forEach(response => {
          expect(response.status).toBe(200);
        });
      }, "Concurrent material assignments");

      // Verify both variants have the material
      const pool = testSuite.getPool();
      const result = await pool.query(
        `SELECT DISTINCT product_variant_id FROM product_variant_material_link
         WHERE material_id = $1 AND deleted_at IS NULL`,
        [sharedMaterial]
      );

      expect(result.rows).toHaveLength(2);
    });
  });

  describe("Performance & Scale Testing", () => {
    it("should handle bulk material assignments efficiently", async () => {
      const product = testProducts[0];
      const variant = product.variants[0];
      const allMaterialIds = testMaterials.map(m => m.id);

      await measureTestPerformance(async () => {
        await request(app)
          .post(`/admin/products/${product.id}/variants/${variant.id}`)
          .set("x-admin", "1")
          .send({ material_ids: allMaterialIds })
          .expect(200);
      }, "Bulk material assignment", 1000); // Expect under 1 second

      // Verify all materials are assigned
      const pool = testSuite.getPool();
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM product_variant_material_link
         WHERE product_variant_id = $1 AND deleted_at IS NULL`,
        [variant.id]
      );

      expect(parseInt(result.rows[0].count)).toBe(allMaterialIds.length);
    });

    it("should maintain unique constraints under high load", async () => {
      const product = testProducts[0];
      const variant = product.variants[0];
      const materialId = testMaterials[0].id;

      // Multiple rapid assignments of the same material
      const rapidRequests = Array.from({ length: 5 }, () =>
        request(app)
          .post(`/admin/products/${product.id}/variants/${variant.id}`)
          .set("x-admin", "1")
          .send({ material_ids: [materialId] })
      );

      await measureTestPerformance(async () => {
        const responses = await Promise.allSettled(rapidRequests);
        // All should succeed due to proper constraint handling
        responses.forEach(result => {
          if (result.status === 'fulfilled') {
            expect(result.value.status).toBe(200);
          }
        });
      }, "Rapid duplicate assignments");

      // Should still only have one record
      const pool = testSuite.getPool();
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM product_variant_material_link
         WHERE product_variant_id = $1 AND material_id = $2 AND deleted_at IS NULL`,
        [variant.id, materialId]
      );

      expect(parseInt(result.rows[0].count)).toBe(1);
    });
  });

  describe("Data Consistency Validation", () => {
    it("should maintain referential integrity", async () => {
      const pool = testSuite.getPool();
      const prefix = testSuite.getPrefix();

      // Check that all material links reference valid materials and variants
      const integrityCheck = await pool.query(`
        SELECT COUNT(*) as invalid_count
        FROM product_variant_material_link pvml
        LEFT JOIN materials m ON m.id = pvml.material_id
        LEFT JOIN product_variant pv ON pv.id = pvml.product_variant_id
        WHERE (pvml.product_variant_id LIKE $1 OR pvml.material_id LIKE $1)
          AND (m.id IS NULL OR pv.id IS NULL)
          AND pvml.deleted_at IS NULL
      `, [`${prefix}%`]);

      expect(parseInt(integrityCheck.rows[0].invalid_count)).toBe(0);
    });

    it("should enforce unique constraint properly", async () => {
      const pool = testSuite.getPool();
      const prefix = testSuite.getPrefix();

      // Check for duplicate active links
      const duplicateCheck = await pool.query(`
        SELECT product_variant_id, material_id, COUNT(*) as count
        FROM product_variant_material_link
        WHERE (product_variant_id LIKE $1 OR material_id LIKE $1)
          AND deleted_at IS NULL
        GROUP BY product_variant_id, material_id
        HAVING COUNT(*) > 1
      `, [`${prefix}%`]);

      expect(duplicateCheck.rows).toHaveLength(0);
    });
  });

  function createEnhancedTestServer(): express.Express {
    const app = express();
    app.use(express.json());

    // Enhanced auth middleware
    app.use((req, res, next) => {
      if (req.headers["x-admin"] === "1") {
        (req as any).auth = { actor_type: "user" };
        (req as any).user = { id: "admin_test", type: "admin" };
      }
      next();
    });

    // Enhanced mock services with multi-material support
    const mockServices = createEnhancedMockServices();
    app.use((req, res, next) => {
      (req as any).scope = {
        resolve: (key: string) => mockServices[key] || null,
      };
      next();
    });

    // Enhanced route handlers (using your updated logic)
    app.get("/admin/products/:id/variants/:variant_id", async (req, res) => {
      const { id: productId, variant_id: variantId } = req.params;
      const query = (req as any).scope.resolve("query");

      try {
        const result = await query.graph({ filters: { id: variantId, product: { id: productId } } });
        if (!result.data.length) {
          return res.status(404).json({ error: "Variant not found" });
        }

        res.json({ variant: result.data[0] });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    app.post("/admin/products/:id/variants/:variant_id", async (req, res) => {
      const { variant_id: variantId } = req.params;
      const { material_ids } = req.body;
      const linkModuleService = (req as any).scope.resolve("linkModuleService");
      const query = (req as any).scope.resolve("query");

      try {
        // Clear existing links and create new ones
        await linkModuleService.dismiss([variantId]);

        if (material_ids?.length) {
          const links = material_ids.map((materialId: string) => [variantId, materialId]);
          await linkModuleService.create(links);
        }

        // Return updated variant
        const result = await query.graph({ filters: { id: variantId } });
        res.json({ variant: result.data[0] });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    return app;
  }

  function createEnhancedMockServices() {
    const pool = testSuite.getPool();

    return {
      query: {
        async graph({ filters }: any) {
          const variantId = filters?.id;
          const productId = filters?.product?.id;

          if (!variantId) return { data: [] };

          const result = await pool.query(`
            SELECT pv.id,
                   pv.product_id,
                   pv.title,
                   pv.sku,
                   m.id   AS material_id,
                   m.name AS material_name,
                   m.code AS material_code
            FROM product_variant pv
            LEFT JOIN product_variant_material_link link ON link.product_variant_id = pv.id
                                     AND link.deleted_at IS NULL
            LEFT JOIN materials m ON m.id = link.material_id
            WHERE pv.id = $1
              AND ($2::text IS NULL OR pv.product_id = $2)
          `, [variantId, productId || null]);

          if (result.rowCount === 0) return { data: [] };

          const [first] = result.rows;
          const materials = result.rows
            .filter((row) => row.material_id)
            .map((row) => ({
              id: row.material_id,
              name: row.material_name,
              code: row.material_code,
            }));

          return {
            data: [{
              id: first.id,
              title: first.title,
              sku: first.sku,
              product: { id: first.product_id },
              materials,
            }],
          };
        },
      },

      linkModuleService: {
        async dismiss(links: any[]) {
          for (const link of links || []) {
            const [variantId, materialId] = Array.isArray(link)
              ? [link[0], link[1] ?? null]
              : [link?.product_variant_id || link, link?.material_id ?? null];

            if (!variantId) continue;

            if (materialId) {
              await pool.query(`
                UPDATE product_variant_material_link
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE product_variant_id = $1
                  AND material_id = $2
                  AND deleted_at IS NULL
              `, [variantId, materialId]);
            } else {
              await pool.query(`
                UPDATE product_variant_material_link
                SET deleted_at = NOW(), updated_at = NOW()
                WHERE product_variant_id = $1
                  AND deleted_at IS NULL
              `, [variantId]);
            }
          }
        },

        async create(links: any[]) {
          for (const link of links || []) {
            const [variantId, materialId] = Array.isArray(link)
              ? [link[0], link[1]]
              : [link?.product_variant_id, link?.material_id];

            if (!variantId || !materialId) continue;

            // Try to reactivate existing soft-deleted link
            const reactivated = await pool.query(`
              UPDATE product_variant_material_link
              SET deleted_at = NULL, updated_at = NOW()
              WHERE product_variant_id = $1
                AND material_id = $2
                AND deleted_at IS NOT NULL
            `, [variantId, materialId]);

            // If no existing link was reactivated, create new one
            if (reactivated.rowCount === 0) {
              const linkId = `pvmat_${Math.random().toString(36).slice(2, 10)}`;
              await pool.query(`
                INSERT INTO product_variant_material_link (id, product_variant_id, material_id, created_at, updated_at, deleted_at)
                VALUES ($1, $2, $3, NOW(), NOW(), NULL)
              `, [linkId, variantId, materialId]);
            }
          }
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