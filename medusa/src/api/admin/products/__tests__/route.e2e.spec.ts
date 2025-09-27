import request from "supertest"
import express from "express"
import bodyParser from "body-parser"
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { Pool } from "pg"
import path from "path"
import fs from "fs"

import { POST as CREATE_POST } from "../route"
import { POST as UPDATE_POST } from "../[id]/route"

// E2E can take time to pull/start containers
jest.setTimeout(120000)

describe("Admin Products API E2E - material_id integration", () => {
  let container: PostgreSqlContainer
  let pool: Pool
  let app: express.Express
  const PREFIX = `prod_e2e_${process.env.GITHUB_RUN_ID || Date.now()}`

  const createServer = (pool: Pool) => {
    const app = express()
    app.use(bodyParser.json())

    // Simple admin auth middleware using header flag
    app.use((req, _res, next) => {
      if (req.headers["x-admin"] === "1") {
        ;(req as any).auth = { actor_type: "user" }
        ;(req as any).user = { type: "admin" }
      }
      next()
    })

    // Minimal services wired to PG
    const productService = {
      async createProducts(input: any) {
        const id = `${PREFIX}_${Math.random().toString(36).slice(2, 8)}`
        const now = new Date()
        await pool.query(
          `INSERT INTO product (id, title, created_at, updated_at) VALUES ($1, $2, $3, $3)`,
          [id, input.title || "Untitled", now]
        )
        return [{ id, title: input.title || "Untitled" }]
      },
      async updateProducts(id: string, input: any) {
        if (input.title) {
          await pool.query(`UPDATE product SET title = $1, updated_at = NOW() WHERE id = $2`, [input.title, id])
        }
        const res = await pool.query(`SELECT id, title, material_id FROM product WHERE id = $1`, [id])
        const row = res.rows[0] || { id, title: input.title || null }
        return [row]
      },
    }

    const materialsService = {
      async retrieveMaterial(id: string) {
        const res = await pool.query(`SELECT id FROM materials WHERE id = $1`, [id])
        const row = res.rows[0]
        if (!row) throw new Error("material not found")
        return row
      },
    }

    // Inject scope resolver for routes under test
    app.use((req, _res, next) => {
      ;(req as any).scope = {
        resolve: (k: string) => {
          if (k === "materialsModuleService") return materialsService
          // Do not provide "query" so routes fall back to raw SQL updates
          if (k === require("@medusajs/framework/utils").Modules.PRODUCT) return productService
          return undefined
        },
      }
      next()
    })

    // Wire the routes under test
    app.post("/admin/products", (req, res) => {
      // @ts-ignore
      CREATE_POST(req, res)
    })

    app.post("/admin/products/:id", (req, res) => {
      // @ts-ignore
      UPDATE_POST(req, res)
    })

    // Helper route for assertions to read from DB directly
    app.get("/admin/_test/products/:id", async (req, res) => {
      const r = await pool.query(`SELECT id, title, material_id FROM product WHERE id = $1`, [req.params.id])
      res.json(r.rows[0] || null)
    })

    return app
  }

  const runSql = async (sql: string) => {
    await pool.query(sql)
  }

  const createSchemas = async () => {
    // Materials schema from module migration
    const schemaSql = fs.readFileSync(
      path.join(process.cwd(), "src/modules/materials/migrations/create-materials-schema.sql"),
      "utf-8"
    )
    await runSql(schemaSql)

    // Minimal product table and FK to materials (to exercise the FK)
    await runSql(`
      CREATE TABLE IF NOT EXISTS product (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        material_id VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Add FK if not exists
    await runSql(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name = 'product' AND constraint_name = 'fk_product_material_id'
        ) THEN
          ALTER TABLE public.product
            ADD CONSTRAINT fk_product_material_id
            FOREIGN KEY (material_id)
            REFERENCES public.materials(id)
            ON UPDATE CASCADE
            ON DELETE SET NULL;
        END IF;
      END$$;
    `)
  }

  const seedMaterials = async () => {
    const now = new Date()
    await pool.query(
      `INSERT INTO materials (id, name, properties, created_at, updated_at) VALUES
       ('${PREFIX}_mat_A', 'E2E Cotton', '{"type":"natural"}', $1, $1),
       ('${PREFIX}_mat_B', 'E2E Linen', '{"type":"natural"}', $1, $1)
      `,
      [now]
    )
  }

  const clearData = async () => {
    await pool.query(`DELETE FROM product WHERE id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM materials WHERE id LIKE '${PREFIX}%'`)
  }

  beforeAll(async () => {
    const envUrl = process.env.DATABASE_URL_TEST || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
    if (envUrl) {
      pool = new Pool({ connectionString: envUrl })
    } else {
      try {
        container = await new PostgreSqlContainer().start()
        const databaseUrl = container.getConnectionUri()
        process.env.DATABASE_URL = databaseUrl
        pool = new Pool({ connectionString: databaseUrl })
      } catch (err) {
        throw new Error(
          "Unable to start Postgres test container and no DATABASE_URL_TEST provided. Set DATABASE_URL_TEST to a reachable Postgres URL or enable Docker."
        )
      }
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

  describe("Create Product with material_id", () => {
    it("creates and persists material_id", async () => {
      // Create product with material_id
      const createRes = await request(app)
        .post("/admin/products")
        .set("x-admin", "1")
        .send({ title: "E2E Product A", material_id: `${PREFIX}_mat_A` })
        .expect(201)

      const product = createRes.body.product
      expect(product).toBeDefined()
      expect(product.material_id).toBe(`${PREFIX}_mat_A`)

      // Retrieve from DB to assert FK stored
      const getRes = await request(app)
        .get(`/admin/_test/products/${product.id}`)
        .set("x-admin", "1")
        .expect(200)
      expect(getRes.body).toBeTruthy()
      expect(getRes.body.material_id).toBe(`${PREFIX}_mat_A`)
    })
  })

  describe("Update Product material_id", () => {
    it("updates material_id using POST /admin/products/:id", async () => {
      // First create without material_id
      const createRes = await request(app)
        .post("/admin/products")
        .set("x-admin", "1")
        .send({ title: "E2E Product B" })
        .expect(201)
      const product = createRes.body.product

      // Update material
      const updateRes = await request(app)
        .post(`/admin/products/${product.id}`)
        .set("x-admin", "1")
        .send({ material_id: `${PREFIX}_mat_B` })
        .expect(200)
      expect(updateRes.body.product.material_id).toBe(`${PREFIX}_mat_B`)

      // Retrieve from DB to assert FK updated
      const getRes = await request(app)
        .get(`/admin/_test/products/${product.id}`)
        .set("x-admin", "1")
        .expect(200)
      expect(getRes.body.material_id).toBe(`${PREFIX}_mat_B`)
    })
  })
})

