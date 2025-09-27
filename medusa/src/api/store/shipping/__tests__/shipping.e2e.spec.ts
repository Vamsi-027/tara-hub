import request from "supertest"
import express from "express"
import bodyParser from "body-parser"
import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { Pool } from "pg"

jest.setTimeout(120000)

describe("Shipping options E2E - US regions", () => {
  let container: PostgreSqlContainer
  let pool: Pool
  let app: express.Express
  const PREFIX = `ship_e2e_${process.env.GITHUB_RUN_ID || Date.now()}`

  const createServer = (pool: Pool) => {
    const app = express()
    app.use(bodyParser.json())

    // Helper endpoints to simulate cart + shipping queries
    app.post("/cart", async (req, res) => {
      const id = `${PREFIX}_cart_${Math.random().toString(36).slice(2, 8)}`
      await pool.query(`INSERT INTO cart (id, region_id, shipping_total) VALUES ($1, $2, 0)`, [id, req.body.region_id])
      res.json({ id })
    })

    app.post("/cart/:id/items", async (req, res) => {
      const { variant_id, unit_price, quantity } = req.body
      const id = `${PREFIX}_item_${Math.random().toString(36).slice(2, 8)}`
      await pool.query(
        `INSERT INTO cart_item (id, cart_id, variant_id, unit_price, quantity) VALUES ($1, $2, $3, $4, $5)`,
        [id, req.params.id, variant_id, unit_price, quantity]
      )
      res.json({ id })
    })

    app.get("/cart/:id/shipping-options", async (req, res) => {
      const r = await pool.query(`SELECT region_id FROM cart WHERE id = $1`, [req.params.id])
      if (r.rowCount === 0) return res.status(404).json({ error: "cart not found" })
      const regionId = r.rows[0].region_id
      const so = await pool.query(
        `SELECT id, name, amount FROM shipping_option WHERE region_id = $1 ORDER BY amount ASC`,
        [regionId]
      )
      res.json({ shipping_options: so.rows })
    })

    app.post("/cart/:id/shipping-options", async (req, res) => {
      const { option_id } = req.body
      const o = await pool.query(`SELECT amount FROM shipping_option WHERE id = $1`, [option_id])
      if (o.rowCount === 0) return res.status(404).json({ error: "shipping option not found" })
      const amount = o.rows[0].amount
      await pool.query(`UPDATE cart SET shipping_total = $1, shipping_option_id = $2 WHERE id = $3`, [amount, option_id, req.params.id])
      res.json({ updated: true })
    })

    app.get("/cart/:id", async (req, res) => {
      const r = await pool.query(`SELECT id, region_id, shipping_total FROM cart WHERE id = $1`, [req.params.id])
      res.json(r.rows[0] || null)
    })

    return app
  }

  const createSchemas = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS region (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shipping_profile (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS shipping_option (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount INTEGER NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        region_id VARCHAR(255) NOT NULL,
        shipping_profile_id VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cart (
        id VARCHAR(255) PRIMARY KEY,
        region_id VARCHAR(255) NOT NULL,
        shipping_option_id VARCHAR(255),
        shipping_total INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS cart_item (
        id VARCHAR(255) PRIMARY KEY,
        cart_id VARCHAR(255) NOT NULL,
        variant_id VARCHAR(255),
        unit_price INTEGER NOT NULL,
        quantity INTEGER NOT NULL
      );
    `)
  }

  const seedRegionAndOptions = async () => {
    const regionId = `${PREFIX}_us_ca`
    await pool.query(`INSERT INTO region (id, name) VALUES ($1, 'California') ON CONFLICT (id) DO NOTHING`, [regionId])
    // profile
    await pool.query(`INSERT INTO shipping_profile (id, name) VALUES ('sp_standard_items', 'Standard Items') ON CONFLICT (id) DO NOTHING`)
    // options
    await pool.query(
      `INSERT INTO shipping_option (id, name, amount, provider_id, region_id, shipping_profile_id) VALUES
       ($1, 'Standard Shipping', 1000, 'manual', $3, 'sp_standard_items'),
       ($2, 'Express Shipping', 2500, 'manual', $3, 'sp_standard_items')
       ON CONFLICT (id) DO NOTHING` ,
      [`${regionId}_ship_std`, `${regionId}_ship_exp`, regionId]
    )
    return regionId
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
  })

  afterAll(async () => {
    await pool?.end()
    if (container) await container.stop()
  })

  beforeEach(async () => {
    await pool.query(`DELETE FROM cart_item WHERE id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM cart WHERE id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM shipping_option WHERE id LIKE '${PREFIX}%' OR region_id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM shipping_profile WHERE id IN ('sp_standard_items')`)
    await pool.query(`DELETE FROM region WHERE id LIKE '${PREFIX}%'`)
  })

  it("lists correct shipping options and applies price to shipping_total", async () => {
    const regionId = await seedRegionAndOptions()

    // Create cart in CA
    const cartRes = await request(app).post("/cart").send({ region_id: regionId }).expect(200)
    const cartId = cartRes.body.id

    // Add a line item (not used for shipping calc here but keeps flow realistic)
    await request(app)
      .post(`/cart/${cartId}/items`)
      .send({ variant_id: `${PREFIX}_var1`, unit_price: 10000, quantity: 1 })
      .expect(200)

    // List shipping options
    const soRes = await request(app).get(`/cart/${cartId}/shipping-options`).expect(200)
    const names = soRes.body.shipping_options.map((o: any) => `${o.name}:${o.amount}`)
    expect(names).toEqual(expect.arrayContaining(["Standard Shipping:1000", "Express Shipping:2500"]))

    // Choose Express
    const expressId = `${regionId}_ship_exp`
    await request(app).post(`/cart/${cartId}/shipping-options`).send({ option_id: expressId }).expect(200)

    // Retrieve cart and assert shipping_total
    const getRes = await request(app).get(`/cart/${cartId}`).expect(200)
    expect(getRes.body.shipping_total).toBe(2500)
  })
})

