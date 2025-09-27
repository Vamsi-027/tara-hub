/**
 * Seed US State Tax Regions
 *
 * Creates/updates a Region per US state with:
 * - currency_code: 'usd'
 * - automatic_taxes: true
 * - includes_tax: false
 * - tax_rate: baseline state-level sales tax
 * - metadata: { state_code: '<STATE>' }
 * - country link: US
 *
 * Run with:
 *   npx medusa exec ./src/scripts/seed-us-state-tax-regions.ts
 */

import { ExecArgs } from "@medusajs/framework/types"
import { Pool } from "pg"

const US_STATE_TAX_RATES: Record<string, number> = {
  AL: 4.0, AK: 0.0,  AZ: 5.6,  AR: 6.5,  CA: 7.25,
  CO: 2.9, CT: 6.35, DE: 0.0,  FL: 6.0,  GA: 4.0,
  HI: 4.0, ID: 6.0,  IL: 6.25, IN: 7.0,  IA: 6.0,
  KS: 6.5, KY: 6.0,  LA: 4.45, ME: 5.5,  MD: 6.0,
  MA: 6.25,MI: 6.0,  MN: 6.875,MS: 7.0,  MO: 4.225,
  MT: 0.0, NE: 5.5,  NV: 6.85, NH: 0.0, NJ: 6.625,
  NM: 5.125,NY: 4.0,  NC: 4.75, ND: 5.0,  OH: 5.75,
  OK: 4.5, OR: 0.0,  PA: 6.0,  RI: 7.0,  SC: 6.0,
  SD: 4.5, TN: 7.0,  TX: 6.25, UT: 4.85, VT: 6.0,
  VA: 4.3, WA: 6.5,  WV: 6.0,  WI: 5.0,  WY: 4.0,
  DC: 6.0,
}

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
}

export default async function seedUSStateTaxRegions(_: ExecArgs) {
  const cs = process.env.DATABASE_URL
  if (!cs) {
    console.error("DATABASE_URL not set. Configure DB connection and retry.")
    return
  }

  const pool = new Pool({ connectionString: cs })
  try {
    // Ensure region table has required columns (compatible with prior migration)
    await pool.query(`
      ALTER TABLE IF EXISTS region
      ADD COLUMN IF NOT EXISTS automatic_taxes BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS gift_cards_taxable BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS includes_tax BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tax_code VARCHAR(255),
      ADD COLUMN IF NOT EXISTS tax_rate NUMERIC;
    `)

    for (const [code, rate] of Object.entries(US_STATE_TAX_RATES)) {
      const id = `us_${code.toLowerCase()}`
      const name = STATE_NAMES[code] || code
      const currency = "usd"
      const metadata = { state_code: code }

      // Upsert region by id
      await pool.query(
        `INSERT INTO region (id, name, currency_code, tax_rate, automatic_taxes, includes_tax, tax_code, metadata)
         VALUES ($1, $2, $3, $4, true, false, 'US', $5)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           currency_code = EXCLUDED.currency_code,
           tax_rate = EXCLUDED.tax_rate,
           automatic_taxes = EXCLUDED.automatic_taxes,
           includes_tax = EXCLUDED.includes_tax,
           tax_code = EXCLUDED.tax_code,
           metadata = EXCLUDED.metadata;
        `,
        [id, name, currency, rate, metadata]
      )

      // Link to US country (region_country table may vary by schema; support iso_2)
      await pool.query(
        `INSERT INTO region_country (region_id, iso_2)
         VALUES ($1, 'us')
         ON CONFLICT DO NOTHING;`,
        [id]
      )
    }

    console.log("✅ Seeded US state tax regions successfully.")
  } catch (e: any) {
    console.error("❌ Failed seeding US state tax regions:", e?.message)
  } finally {
    await pool.end()
  }
}

