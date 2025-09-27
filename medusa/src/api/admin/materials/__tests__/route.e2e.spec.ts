import request from "supertest"
import express from "express"
import bodyParser from "body-parser"
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { Pool } from "pg"
import path from "path"
import fs from "fs"

import { GET as LIST_GET } from "../route"
import { GET as ID_GET } from "../[id]/route"

// E2E can take time to pull/start containers
jest.setTimeout(120000)

describe("Admin Materials API E2E", () => {
  let container: PostgreSqlContainer
  let pool: Pool
  let app: express.Express
  const PREFIX = `mat_e2e_${process.env.GITHUB_RUN_ID || Date.now()}`

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

    // Minimal service wired to PG for listWithMeta + retrieveMaterial
    const service = {
      async listWithMeta({ limit, offset, q }: { limit?: number; offset?: number; q?: string }) {
        const take = typeof limit === "number" ? Math.min(Math.max(limit, 1), 100) : 20
        const skip = typeof offset === "number" && offset >= 0 ? offset : 0
        const params: any[] = []
        let where = ""
        if (q) {
          params.push(`%${q}%`)
          where = `WHERE name ILIKE $${params.length}`
        }
        const countSql = `SELECT COUNT(*)::int AS count FROM materials ${where}`
        const countRes = await pool.query(countSql, params)
        const total = countRes.rows[0]?.count ?? 0

        const pageParams = [...params]
        pageParams.push(take)
        pageParams.push(skip)
        const listSql = `SELECT id, name, properties, created_at, updated_at
                         FROM materials ${where}
                         ORDER BY name ASC
                         LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`
        const listRes = await pool.query(listSql, pageParams)
        const materials = listRes.rows
        return {
          materials,
          count: total,
          pagination: {
            limit: take,
            offset: skip,
            total,
            totalPages: Math.max(1, Math.ceil(total / Math.max(1, take))),
            currentPage: Math.floor(skip / Math.max(1, take)) + 1,
            hasNext: skip + take < total,
            hasPrevious: skip > 0,
          },
        }
      },
      async retrieveMaterial(id: string) {
        const res = await pool.query(
          `SELECT id, name, properties, created_at, updated_at FROM materials WHERE id = $1`,
          [id]
        )
        const row = res.rows[0]
        if (!row) throw new Error("not found")
        return row
      },
    }

    // Inject scope resolver for routes under test
    app.use((req, _res, next) => {
      ;(req as any).scope = { resolve: (k: string) => (k === "materialsModuleService" ? service : {}) }
      next()
    })

    app.get("/admin/materials", (req, res) => {
      // route expects MedusaRequest types, but our shape is compatible for our code paths
      // @ts-ignore
      LIST_GET(req, res)
    })

    app.get("/admin/materials/:id", (req, res) => {
      // @ts-ignore
      ID_GET(req, res)
    })

    return app
  }

  const runSql = async (sql: string) => {
    await pool.query(sql)
  }

  const seedMaterials = async () => {
    const now = new Date()
    await pool.query(
      `INSERT INTO materials (id, name, properties, created_at, updated_at) VALUES
       ('${PREFIX}_1', 'Test Cotton', '{"type":"natural"}', $1, $1),
       ('${PREFIX}_2', 'Test Linen', '{"type":"natural"}', $1, $1),
       ('${PREFIX}_3', 'Test Silk', '{"type":"protein"}', $1, $1)
      `,
      [now]
    )
  }

  const clearMaterials = async () => {
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

    // Create schema from SQL migration
    const schemaSql = fs.readFileSync(
      path.join(process.cwd(), "src/modules/materials/migrations/create-materials-schema.sql"),
      "utf-8"
    )
    await runSql(schemaSql)

    app = createServer(pool)
  }, 120000)

  afterAll(async () => {
    await pool?.end()
    if (container) {
      await container.stop()
    }
  })

  beforeEach(async () => {
    await clearMaterials()
    await seedMaterials()
  })

  describe("Authentication", () => {
    it("GET /admin/materials returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/admin/materials").expect(401)
      expect(res.body.error).toBeDefined()
    })
  })

  describe("GET /admin/materials", () => {
    it("returns list and pagination for authenticated admin", async () => {
      const res = await request(app)
        .get("/admin/materials")
        .set("x-admin", "1")
        .query({ limit: 2, offset: 0 })
        .expect(200)

      expect(Array.isArray(res.body.materials)).toBe(true)
      expect(res.body.count).toBeGreaterThanOrEqual(3)
      expect(res.body.pagination.limit).toBe(2)
      expect(res.body.pagination.offset).toBe(0)
    })

    it("supports search via q", async () => {
      const res = await request(app)
        .get("/admin/materials")
        .set("x-admin", "1")
        .query({ q: "Cotton" })
        .expect(200)

      const names = res.body.materials.map((m: any) => m.name)
      expect(names).toEqual(expect.arrayContaining(["Test Cotton"]))
    })
  })

  describe("GET /admin/materials/:id", () => {
    it("returns single material for authenticated admin", async () => {
      const res = await request(app)
        .get(`/admin/materials/${PREFIX}_2`)
        .set("x-admin", "1")
        .expect(200)

      expect(res.body).toHaveProperty("material")
      expect(res.body.material.id).toBe(`${PREFIX}_2`)
      expect(res.body.material.name).toBe("Test Linen")
    })

    it("returns 404 for non-existent material", async () => {
      await request(app)
        .get("/admin/materials/mat_missing")
        .set("x-admin", "1")
        .expect(404)
    })
  })
})
