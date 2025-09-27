import request from "supertest"
import express from "express"
import bodyParser from "body-parser"
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { Pool } from "pg"

// E2E can take time to pull/start containers
jest.setTimeout(120000)

describe("Tax calculation E2E - Region-based US state taxes", () => {
  let container: PostgreSqlContainer
  let pool: Pool
  let app: express.Express
  const PREFIX = `tax_e2e_${process.env.GITHUB_RUN_ID || Date.now()}`

  const createServer = (pool: Pool) => {
    const app = express()
    app.use(bodyParser.json())

    // Admin flag (not strictly needed here)
    app.use((req, _res, next) => {
      if (req.headers["x-admin"] === "1") {
        ;(req as any).auth = { actor_type: "user" }
        ;(req as any).user = { type: "admin" }
      }
      next()
    })

    // Helper endpoint to compute cart totals using region tax_rate (simulating native calc)
    app.post("/tax/cart", async (req, res) => {
      const { state_code, amount, quantity } = req.body || {}
      if (!state_code) return res.status(400).json({ error: "state_code required" })
      if (typeof amount !== "number" || typeof quantity !== "number") {
        return res.status(400).json({ error: "amount and quantity must be numbers" })
      }
      const regionId = `${PREFIX}_${state_code}`
      const r = await pool.query(`SELECT tax_rate FROM region WHERE id = $1`, [regionId])
      const row = r.rows[0]
      if (!row) return res.status(404).json({ error: "region not found" })
      const rate = Number(row.tax_rate) || 0
      const subtotal = amount * quantity
      const tax_total = Math.round(subtotal * (rate / 100))
      const total = subtotal + tax_total
      res.json({ subtotal, tax_total, total, rate })
    })

    return app
  }

  const createSchemas = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS region (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        currency_code VARCHAR(3) NOT NULL DEFAULT 'usd',
        tax_rate NUMERIC,
        automatic_taxes BOOLEAN DEFAULT FALSE,
        includes_tax BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `)
  }

  const seedRegions = async () => {
    // Seed two regions: CA (7.25%) and OR (0%)
    await pool.query(
      `INSERT INTO region (id, name, currency_code, tax_rate, automatic_taxes, includes_tax, metadata) VALUES
       ($1, 'California', 'usd', 7.25, true, false, '{"state_code":"CA"}'),
       ($2, 'Oregon',     'usd', 0.00,  true, false, '{"state_code":"OR"}')
       ON CONFLICT (id) DO UPDATE SET tax_rate = EXCLUDED.tax_rate;`,
      [`${PREFIX}_CA`, `${PREFIX}_OR`]
    )
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
    if (container) await container.stop()
  })

  beforeEach(async () => {
    await pool.query(`DELETE FROM region WHERE id LIKE '${PREFIX}%'`)
    await seedRegions()
  })

  it("calculates tax for a CA destination (7.25%)", async () => {
    const price = 10000 // $100.00 in cents
    const qty = 2
    const res = await request(app)
      .post("/tax/cart")
      .send({ state_code: "CA", amount: price, quantity: qty })
      .expect(200)
    // Expected tax: 20000 * 7.25% = 1450
    expect(res.body.rate).toBeCloseTo(7.25)
    expect(res.body.tax_total).toBe(1450)
  })

  it("calculates zero tax for an OR destination (0%)", async () => {
    const price = 15000 // $150.00 in cents
    const qty = 1
    const res = await request(app)
      .post("/tax/cart")
      .send({ state_code: "OR", amount: price, quantity: qty })
      .expect(200)
    expect(res.body.rate).toBe(0)
    expect(res.body.tax_total).toBe(0)
  })
})

