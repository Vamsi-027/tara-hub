import { PostgreSqlContainer } from "@testcontainers/postgresql"
import { Pool } from "pg"

jest.setTimeout(120000)

describe("Inventory reservations E2E - single warehouse", () => {
  let container: PostgreSqlContainer
  let pool: Pool
  const PREFIX = `inv_e2e_${process.env.GITHUB_RUN_ID || Date.now()}`

  const createSchemas = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_location (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS product_variant (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255)
      );
      CREATE TABLE IF NOT EXISTS inventory_item (
        id VARCHAR(255) PRIMARY KEY,
        variant_id VARCHAR(255) UNIQUE
      );
      CREATE TABLE IF NOT EXISTS inventory_level (
        item_id VARCHAR(255) NOT NULL,
        location_id VARCHAR(255) NOT NULL,
        stocked_quantity INTEGER NOT NULL,
        PRIMARY KEY (item_id, location_id)
      );
      CREATE TABLE IF NOT EXISTS reservation (
        id VARCHAR(255) PRIMARY KEY,
        item_id VARCHAR(255) NOT NULL,
        location_id VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL
      );
    `)
  }

  const inventoryService = {
    async getOrCreateItemByVariant(variantId: string) {
      const r = await pool.query(`SELECT id FROM inventory_item WHERE variant_id = $1`, [variantId])
      if (r.rowCount > 0) return { id: r.rows[0].id, variant_id: variantId }
      const id = `${PREFIX}_item_${Math.random().toString(36).slice(2, 10)}`
      await pool.query(`INSERT INTO inventory_item (id, variant_id) VALUES ($1, $2)`, [id, variantId])
      return { id, variant_id: variantId }
    },
    async setInitialStock(itemId: string, locationId: string, qty: number) {
      await pool.query(
        `INSERT INTO inventory_level (item_id, location_id, stocked_quantity) VALUES ($1, $2, $3)
         ON CONFLICT (item_id, location_id) DO UPDATE SET stocked_quantity = EXCLUDED.stocked_quantity`,
        [itemId, locationId, qty]
      )
    },
    async createReservation(itemId: string, locationId: string, qty: number) {
      const id = `${PREFIX}_res_${Math.random().toString(36).slice(2, 10)}`
      await pool.query(
        `INSERT INTO reservation (id, item_id, location_id, quantity) VALUES ($1, $2, $3, $4)`,
        [id, itemId, locationId, qty]
      )
      return { id }
    },
    async getLevel(itemId: string, locationId: string) {
      const lvl = await pool.query(
        `SELECT stocked_quantity FROM inventory_level WHERE item_id = $1 AND location_id = $2`,
        [itemId, locationId]
      )
      const stocked = lvl.rows[0]?.stocked_quantity || 0
      const res = await pool.query(
        `SELECT COALESCE(SUM(quantity), 0)::int as reserved FROM reservation WHERE item_id = $1 AND location_id = $2`,
        [itemId, locationId]
      )
      const reserved = res.rows[0]?.reserved || 0
      const available = stocked - reserved
      return { stocked_quantity: stocked, available_quantity: available }
    },
  }

  beforeAll(async () => {
    const envUrl = process.env.DATABASE_URL_TEST || process.env.NEON_DATABASE_URL || process.env.DATABASE_URL
    if (envUrl) {
      pool = new Pool({ connectionString: envUrl })
    } else {
      container = await new PostgreSqlContainer().start()
      const url = container.getConnectionUri()
      process.env.DATABASE_URL = url
      pool = new Pool({ connectionString: url })
    }
    await createSchemas()
  })

  afterAll(async () => {
    await pool?.end()
    if (container) await container.stop()
  })

  beforeEach(async () => {
    await pool.query(`DELETE FROM reservation WHERE id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM inventory_level WHERE item_id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM inventory_item WHERE id LIKE '${PREFIX}%' OR variant_id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM product_variant WHERE id LIKE '${PREFIX}%'`)
    await pool.query(`DELETE FROM stock_location WHERE id IN ('loc_main') OR id LIKE '${PREFIX}%'`)
    await pool.query(`INSERT INTO stock_location (id, name) VALUES ('loc_main', 'Main Warehouse') ON CONFLICT (id) DO NOTHING`)
  })

  it("reserves stock: stocked stays, available decreases", async () => {
    // Create a variant
    const variantId = `${PREFIX}_var1`
    await pool.query(`INSERT INTO product_variant (id, title) VALUES ($1, 'Variant')`, [variantId])

    // Get inventory item for variant
    const item = await inventoryService.getOrCreateItemByVariant(variantId)

    // Set initial stock to 100 at Main Warehouse
    await inventoryService.setInitialStock(item.id, 'loc_main', 100)

    // Create reservation of 5
    await inventoryService.createReservation(item.id, 'loc_main', 5)

    // Check levels
    const level = await inventoryService.getLevel(item.id, 'loc_main')
    expect(level.stocked_quantity).toBe(100)
    expect(level.available_quantity).toBe(95)
  })
})

