import request from "supertest"
import express from "express"
import bodyParser from "body-parser"
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { Pool } from "pg"
import path from "path"
import fs from "fs"

import { GET as GET_VARIANT, POST as POST_VARIANT } from "../[id]/variants/[variant_id]/route"

jest.setTimeout(120000)

describe("Admin Product Variant material link API", () => {
  let container: PostgreSqlContainer
  let pool: Pool
  let app: express.Express
  const PREFIX = `prod_variant_${process.env.GITHUB_RUN_ID || Date.now()}`

  const createServer = (pool: Pool) => {
    const app = express()
    app.use(bodyParser.json())

    app.use((req, _res, next) => {
      if (req.headers["x-admin"] === "1") {
        ;(req as any).auth = { actor_type: "user" }
        ;(req as any).user = { id: "admin_test", type: "admin" }
      }
      next()
    })

    const generateLinkId = () => `pvmat_${Math.random().toString(36).slice(2, 10)}`

    const query = {
      async graph({ filters }: any) {
        const variantId = filters?.id
        const productId = filters?.product?.id
        if (!variantId) {
          return { data: [] }
        }

        const result = await pool.query(
          `SELECT pv.id,
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
              AND ($2::text IS NULL OR pv.product_id = $2)`,
          [variantId, productId || null]
        )

        if (result.rowCount === 0) {
          return { data: [] }
        }

        const [first] = result.rows
        const materials = result.rows
          .filter((row) => row.material_id)
          .map((row) => ({
            id: row.material_id,
            name: row.material_name,
            code: row.material_code,
          }))

        return {
          data: [
            {
              id: first.id,
              title: first.title,
              sku: first.sku,
              product: { id: first.product_id },
              materials,
            },
          ],
        }
      },
    }

    const linkModuleService = {
      async dismiss(links: any[]) {
        for (const link of links || []) {
          const [variantId, materialId] = Array.isArray(link)
            ? [link[0], link[1] ?? null]
            : [link?.product_variant_id, link?.material_id ?? null]
          if (!variantId) continue
          if (materialId) {
            await pool.query(
              `UPDATE product_variant_material_link
                  SET deleted_at = NOW(), updated_at = NOW()
                WHERE product_variant_id = $1
                  AND material_id = $2
                  AND deleted_at IS NULL`,
              [variantId, materialId]
            )
          } else {
            await pool.query(
              `UPDATE product_variant_material_link
                  SET deleted_at = NOW(), updated_at = NOW()
                WHERE product_variant_id = $1
                  AND deleted_at IS NULL`,
              [variantId]
            )
          }
        }
      },
      async create(links: any[]) {
        for (const link of links || []) {
          const [variantId, materialId] = Array.isArray(link)
            ? [link[0], link[1]]
            : [link?.product_variant_id, link?.material_id]
          if (!variantId || !materialId) continue
          const reactivated = await pool.query(
            `UPDATE product_variant_material_link
                SET deleted_at = NULL, updated_at = NOW()
              WHERE product_variant_id = $1
                AND material_id = $2
                AND deleted_at IS NOT NULL`,
            [variantId, materialId]
          )

          if (reactivated.rowCount === 0) {
            await pool.query(
              `INSERT INTO product_variant_material_link (id, product_variant_id, material_id, created_at, updated_at, deleted_at)
               VALUES ($1, $2, $3, NOW(), NOW(), NULL)`,
              [generateLinkId(), variantId, materialId]
            )
          }
        }
      },
    }

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
    }

    app.use((req, _res, next) => {
      ;(req as any).scope = {
        resolve: (key: string) => {
          if (key === "query" || key === "QUERY") return query
          if (key === "linkModuleService" || key === "LINK_MODULE_SERVICE")
            return linkModuleService
          if (key === "logger" || key === "LOGGER") return logger
          return undefined
        },
      }
      next()
    })

    app.get("/admin/products/:id/variants/:variant_id", (req, res) => {
      // @ts-ignore
      GET_VARIANT(req, res)
    })

    app.post("/admin/products/:id/variants/:variant_id", (req, res) => {
      // @ts-ignore
      POST_VARIANT(req, res)
    })

    return app
  }

  const runSql = async (sql: string, params: any[] = []) => {
    await pool.query(sql, params)
  }

  const createSchemas = async () => {
    const schemaSql = fs.readFileSync(
      path.join(process.cwd(), "src/modules/materials/migrations/create-materials-schema.sql"),
      "utf-8"
    )
    await runSql(schemaSql)

    await runSql(`
      CREATE TABLE IF NOT EXISTS product (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await runSql(`
      CREATE TABLE IF NOT EXISTS product_variant (
        id VARCHAR(255) PRIMARY KEY,
        product_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        sku VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_variant_product FOREIGN KEY (product_id)
          REFERENCES public.product(id) ON DELETE CASCADE
      );
    `)

    await runSql(`
      CREATE TABLE IF NOT EXISTS product_variant_material_link (
        id TEXT PRIMARY KEY DEFAULT concat('pvmat_', md5(random()::text)),
        product_variant_id VARCHAR(255) NOT NULL,
        material_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        CONSTRAINT fk_pvml_variant FOREIGN KEY (product_variant_id)
          REFERENCES public.product_variant(id) ON DELETE CASCADE,
        CONSTRAINT fk_pvml_material FOREIGN KEY (material_id)
          REFERENCES public.materials(id) ON DELETE RESTRICT
      );
    `)

    await runSql(`CREATE INDEX IF NOT EXISTS idx_pvml_material_id ON product_variant_material_link (material_id);`)
    await runSql(
      `CREATE INDEX IF NOT EXISTS idx_pvml_deleted_at ON product_variant_material_link (deleted_at) WHERE deleted_at IS NULL;`
    )
    await runSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_pvml_variant_material_active
         ON product_variant_material_link (product_variant_id, material_id)
         WHERE deleted_at IS NULL;`
    )
  }

  const seedMaterials = async () => {
    const now = new Date()
    await runSql(
      `INSERT INTO materials (id, name, properties, created_at, updated_at) VALUES
        ($1, 'Seed Cotton', '{"type":"cotton"}', $4, $4),
        ($2, 'Seed Linen', '{"type":"linen"}', $4, $4),
        ($3, 'Seed Silk', '{"type":"silk"}', $4, $4)
       ON CONFLICT (id) DO NOTHING`,
      [`${PREFIX}_mat_A`, `${PREFIX}_mat_B`, `${PREFIX}_mat_C`, now]
    )
  }

  const createProductWithVariants = async () => {
    const productId = `${PREFIX}_prod`
    await runSql(`INSERT INTO product (id, title) VALUES ($1, 'Variant Test Product') ON CONFLICT (id) DO NOTHING`, [
      productId,
    ])

    const variants = [
      { id: `${PREFIX}_variant_a`, title: "Variant A", sku: `${PREFIX}_SKU_A` },
      { id: `${PREFIX}_variant_b`, title: "Variant B", sku: `${PREFIX}_SKU_B` },
    ]

    for (const variant of variants) {
      await runSql(
        `INSERT INTO product_variant (id, product_id, title, sku) VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [variant.id, productId, variant.title, variant.sku]
      )
    }

    return { productId, variants }
  }

  const clearData = async () => {
    await runSql(`DELETE FROM product_variant_material_link WHERE product_variant_id LIKE '${PREFIX}%'`)
    await runSql(`DELETE FROM product_variant WHERE id LIKE '${PREFIX}%'`)
    await runSql(`DELETE FROM product WHERE id LIKE '${PREFIX}%'`)
    await runSql(`DELETE FROM materials WHERE id LIKE '${PREFIX}%'`)
  }

  beforeAll(async () => {
    const envUrl = process.env.DATABASE_URL_TEST || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
    if (envUrl) {
      pool = new Pool({ connectionString: envUrl })
    } else {
      container = await new PostgreSqlContainer().start()
      const databaseUrl = container.getConnectionUri()
      process.env.DATABASE_URL = databaseUrl
      pool = new Pool({ connectionString: databaseUrl })
    }

    await createSchemas()
    app = createServer(pool)
  }, 120000)

  afterAll(async () => {
    await pool?.end()
    if (container) {
      await container.stop()
    }
  })

  beforeEach(async () => {
    await clearData()
    await seedMaterials()
  })

  it("assigns multiple materials to a variant", async () => {
    const { productId, variants } = await createProductWithVariants()
    const variant = variants[0]

    const response = await request(app)
      .post(`/admin/products/${productId}/variants/${variant.id}`)
      .set("x-admin", "1")
      .send({ material_ids: [`${PREFIX}_mat_A`, `${PREFIX}_mat_B`] })
      .expect(200)

    const linkRows = await pool.query(
      `SELECT product_variant_id, material_id FROM product_variant_material_link
        WHERE deleted_at IS NULL AND product_variant_id = $1
        ORDER BY material_id`,
      [variant.id]
    )

    expect(linkRows.rows).toEqual([
      { product_variant_id: variant.id, material_id: `${PREFIX}_mat_A` },
      { product_variant_id: variant.id, material_id: `${PREFIX}_mat_B` },
    ])

    expect(response.body.variant.materials.map((m: any) => m.id).sort()).toEqual([
      `${PREFIX}_mat_A`,
      `${PREFIX}_mat_B`,
    ])
  })

  it("removes selected materials while retaining others", async () => {
    const { productId, variants } = await createProductWithVariants()
    const variant = variants[0]

    await request(app)
      .post(`/admin/products/${productId}/variants/${variant.id}`)
      .set("x-admin", "1")
      .send({ material_ids: [`${PREFIX}_mat_A`, `${PREFIX}_mat_B`, `${PREFIX}_mat_C`] })
      .expect(200)

    const removalResponse = await request(app)
      .post(`/admin/products/${productId}/variants/${variant.id}`)
      .set("x-admin", "1")
      .send({ material_ids: [`${PREFIX}_mat_A`, `${PREFIX}_mat_C`] })
      .expect(200)

    const activeRows = await pool.query(
      `SELECT product_variant_id, material_id FROM product_variant_material_link
        WHERE deleted_at IS NULL AND product_variant_id = $1
        ORDER BY material_id`,
      [variant.id]
    )

    expect(activeRows.rows).toEqual([
      { product_variant_id: variant.id, material_id: `${PREFIX}_mat_A` },
      { product_variant_id: variant.id, material_id: `${PREFIX}_mat_C` },
    ])

    const allRows = await pool.query(
      `SELECT material_id, deleted_at FROM product_variant_material_link
        WHERE product_variant_id = $1
        ORDER BY material_id`,
      [variant.id]
    )

    const deletedRow = allRows.rows.find((row) => row.material_id === `${PREFIX}_mat_B`)
    expect(deletedRow?.deleted_at).not.toBeNull()

    expect(removalResponse.body.variant.materials.map((m: any) => m.id).sort()).toEqual([
      `${PREFIX}_mat_A`,
      `${PREFIX}_mat_C`,
    ])
  })

  it("deduplicates incoming material IDs", async () => {
    const { productId, variants } = await createProductWithVariants()
    const variant = variants[1]

    await request(app)
      .post(`/admin/products/${productId}/variants/${variant.id}`)
      .set("x-admin", "1")
      .send({ material_ids: [`${PREFIX}_mat_A`, `${PREFIX}_mat_A`, `${PREFIX}_mat_B`] })
      .expect(200)

    const activeRows = await pool.query(
      `SELECT material_id FROM product_variant_material_link
        WHERE deleted_at IS NULL AND product_variant_id = $1
        ORDER BY material_id`,
      [variant.id]
    )

    expect(activeRows.rows).toEqual([
      { material_id: `${PREFIX}_mat_A` },
      { material_id: `${PREFIX}_mat_B` },
    ])
  })

  it("retrieves variant with material array", async () => {
    const { productId, variants } = await createProductWithVariants()
    const variant = variants[0]

    await request(app)
      .post(`/admin/products/${productId}/variants/${variant.id}`)
      .set("x-admin", "1")
      .send({ material_ids: [`${PREFIX}_mat_A`, `${PREFIX}_mat_B`] })
      .expect(200)

    const res = await request(app)
      .get(`/admin/products/${productId}/variants/${variant.id}`)
      .set("x-admin", "1")
      .expect(200)

    expect(res.body.variant.materials.map((m: any) => m.id).sort()).toEqual([
      `${PREFIX}_mat_A`,
      `${PREFIX}_mat_B`,
    ])
  })
})
