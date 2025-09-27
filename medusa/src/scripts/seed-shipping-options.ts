/**
 * Seed Default Shipping Profile and Options for US Regions
 *
 * - Creates a single shipping_profile: "Standard Items"
 * - For every region with id like 'us_%', creates two shipping options (manual provider):
 *   - Standard Shipping ($10.00)
 *   - Express Shipping ($25.00)
 *
 * Run with:
 *   npx medusa exec ./src/scripts/seed-shipping-options.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Pool } from "pg"

export default async function seedShippingOptions(_: ExecArgs) {
  const cs = process.env.DATABASE_URL
  if (!cs) {
    console.error("DATABASE_URL not set. Configure DB connection and retry.")
    return
  }

  const pool = new Pool({ connectionString: cs })
  try {
    // Ensure minimal schemas exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_profile (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shipping_option (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        amount INTEGER NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        region_id VARCHAR(255) NOT NULL,
        shipping_profile_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    // Upsert default shipping profile
    const profileId = "sp_standard_items"
    await pool.query(
      `INSERT INTO shipping_profile (id, name, type)
       VALUES ($1, $2, 'default')
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
      [profileId, "Standard Items"]
    )

    // Fetch US regions
    const regions = await pool.query(`SELECT id FROM region WHERE id LIKE 'us\_%' OR id LIKE 'us-%'`)
    if (regions.rowCount === 0) {
      console.warn("No US regions found (ids starting with 'us_'). Seed regions first.")
    }

    for (const r of regions.rows) {
      const regionId = r.id as string
      const standardId = `${regionId}_ship_std`
      const expressId = `${regionId}_ship_exp`

      await pool.query(
        `INSERT INTO shipping_option (id, name, amount, provider_id, region_id, shipping_profile_id)
         VALUES ($1, $2, 1000, 'manual', $3, $4)
         ON CONFLICT (id) DO NOTHING;`,
        [standardId, "Standard Shipping", regionId, profileId]
      )

      await pool.query(
        `INSERT INTO shipping_option (id, name, amount, provider_id, region_id, shipping_profile_id)
         VALUES ($1, $2, 2500, 'manual', $3, $4)
         ON CONFLICT (id) DO NOTHING;`,
        [expressId, "Express Shipping", regionId, profileId]
      )
    }

    console.log("✅ Seeded default shipping profile and options for US regions.")
  } catch (e: any) {
    console.error("❌ Failed seeding shipping options:", e?.message)
  } finally {
    await pool.end()
  }
}

