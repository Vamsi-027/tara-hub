/**
 * Seed a default Stock Location: "Main Warehouse"
 * Attempts to link it to an existing default sales channel when possible.
 *
 * Run with:
 *   npx medusa exec ./src/scripts/seed-main-warehouse.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Pool } from "pg"

export default async function seedMainWarehouse(_: ExecArgs) {
  const cs = process.env.DATABASE_URL
  if (!cs) {
    console.error("DATABASE_URL not set. Configure DB connection and retry.")
    return
  }

  const pool = new Pool({ connectionString: cs })
  try {
    // Create minimal stock_location and sales_channel tables when missing
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stock_location (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sales_channel (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `)

    const locId = "loc_main"
    await pool.query(
      `INSERT INTO stock_location (id, name) VALUES ($1, 'Main Warehouse')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
      [locId]
    )

    // Try to find a default sales channel; otherwise create one
    let sc = await pool.query(`SELECT id FROM sales_channel ORDER BY id LIMIT 1`)
    if (sc.rowCount === 0) {
      await pool.query(`INSERT INTO sales_channel (id, name) VALUES ('sc_default', 'Default Store') ON CONFLICT (id) DO NOTHING`)
      sc = await pool.query(`SELECT id FROM sales_channel WHERE id = 'sc_default'`)
    }
    const scId = sc.rows[0].id as string

    // Attempt to link via any known junction table name
    const candidates = [
      { table: "sales_channel_location", sc_col: "sales_channel_id", loc_col: "stock_location_id" },
      { table: "stock_location_sales_channel", sc_col: "sales_channel_id", loc_col: "stock_location_id" },
      { table: "sales_channel_stock_location", sc_col: "sales_channel_id", loc_col: "stock_location_id" },
    ]

    for (const c of candidates) {
      const exists = await pool.query(
        `SELECT to_regclass($1) AS t`,
        [c.table]
      )
      if (exists.rows[0]?.t) {
        await pool.query(
          `INSERT INTO ${c.table} (${c.sc_col}, ${c.loc_col}) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [scId, locId]
        )
        console.log(`✅ Linked Main Warehouse to sales channel via ${c.table}`)
        break
      }
    }

    console.log("✅ Seeded Main Warehouse stock location")
  } catch (e: any) {
    console.error("❌ Failed seeding Main Warehouse:", e?.message)
  } finally {
    await pool.end()
  }
}

