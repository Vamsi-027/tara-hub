import { Migration } from "@mikro-orm/migrations"

export class FixRegionFields extends Migration {
  async up(): Promise<void> {
    // Add missing columns to region table if they don't exist
    await this.execute(`
      -- Ensure all required fields exist in region table
      ALTER TABLE region
      ADD COLUMN IF NOT EXISTS automatic_taxes BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS gift_cards_taxable BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS includes_tax BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS tax_code VARCHAR(255),
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    `)

    // Update existing regions with default values
    await this.execute(`
      UPDATE region
      SET
        automatic_taxes = COALESCE(automatic_taxes, false),
        gift_cards_taxable = COALESCE(gift_cards_taxable, true),
        includes_tax = COALESCE(includes_tax, false),
        metadata = COALESCE(metadata, '{}'::jsonb)
      WHERE automatic_taxes IS NULL
         OR gift_cards_taxable IS NULL
         OR includes_tax IS NULL
         OR metadata IS NULL;
    `)

    // Ensure countries relationship exists
    await this.execute(`
      -- Ensure country table exists
      CREATE TABLE IF NOT EXISTS country (
        id VARCHAR(255) PRIMARY KEY,
        iso_2 VARCHAR(2) NOT NULL UNIQUE,
        iso_3 VARCHAR(3),
        num_code VARCHAR(3),
        name VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure region_country junction table exists
      CREATE TABLE IF NOT EXISTS region_country (
        region_id VARCHAR(255) NOT NULL,
        country_id VARCHAR(255),
        iso_2 VARCHAR(2),
        FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE CASCADE,
        PRIMARY KEY (region_id, COALESCE(country_id, iso_2))
      );

      -- Insert US country if not exists
      INSERT INTO country (id, iso_2, iso_3, name, display_name)
      VALUES ('us', 'us', 'usa', 'United States', 'United States')
      ON CONFLICT (iso_2) DO NOTHING;

      -- Insert EU countries if not exists
      INSERT INTO country (id, iso_2, iso_3, name, display_name)
      VALUES
        ('de', 'de', 'deu', 'Germany', 'Germany'),
        ('fr', 'fr', 'fra', 'France', 'France'),
        ('gb', 'gb', 'gbr', 'United Kingdom', 'United Kingdom'),
        ('it', 'it', 'ita', 'Italy', 'Italy'),
        ('es', 'es', 'esp', 'Spain', 'Spain')
      ON CONFLICT (iso_2) DO NOTHING;
    `)

    // Link regions to countries
    await this.execute(`
      -- Link US region to US country
      INSERT INTO region_country (region_id, iso_2)
      SELECT id, 'us' FROM region WHERE name = 'United States'
      ON CONFLICT DO NOTHING;

      -- Link Europe region to EU countries
      INSERT INTO region_country (region_id, iso_2)
      SELECT r.id, c.iso_2
      FROM region r, (VALUES ('de'), ('fr'), ('gb'), ('it'), ('es')) AS c(iso_2)
      WHERE r.name = 'Europe'
      ON CONFLICT DO NOTHING;
    `)

    // Ensure payment and fulfillment provider tables exist
    await this.execute(`
      -- Payment providers
      CREATE TABLE IF NOT EXISTS region_payment_provider (
        region_id VARCHAR(255) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE CASCADE,
        PRIMARY KEY (region_id, provider_id)
      );

      -- Fulfillment providers
      CREATE TABLE IF NOT EXISTS region_fulfillment_provider (
        region_id VARCHAR(255) NOT NULL,
        provider_id VARCHAR(255) NOT NULL,
        FOREIGN KEY (region_id) REFERENCES region(id) ON DELETE CASCADE,
        PRIMARY KEY (region_id, provider_id)
      );

      -- Add manual providers to all regions
      INSERT INTO region_payment_provider (region_id, provider_id)
      SELECT id, 'manual' FROM region
      ON CONFLICT DO NOTHING;

      INSERT INTO region_fulfillment_provider (region_id, provider_id)
      SELECT id, 'manual' FROM region
      ON CONFLICT DO NOTHING;
    `)
  }

  async down(): Promise<void> {
    // Reversal not needed for fixing data
  }
}