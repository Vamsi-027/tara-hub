import { Migration } from "@mikro-orm/migrations";

export class CreateInventoryAdjustment extends Migration {
  async up(): Promise<void> {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS inventory_adjustment (
        id VARCHAR(255) PRIMARY KEY,
        inventory_item_id VARCHAR(255) NOT NULL,
        location_id VARCHAR(255) NOT NULL,
        reason VARCHAR(255) NOT NULL,
        note TEXT NULL,
        reference VARCHAR(255) NULL,
        delta DOUBLE PRECISION NULL,
        to_quantity DOUBLE PRECISION NULL,
        prev_quantity DOUBLE PRECISION NOT NULL,
        new_quantity DOUBLE PRECISION NOT NULL,
        actor_id VARCHAR(255) NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_item ON inventory_adjustment (inventory_item_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_location ON inventory_adjustment (location_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_adjustment_created_at ON inventory_adjustment (created_at);
    `);
  }

  async down(): Promise<void> {
    await this.execute(`DROP TABLE IF EXISTS inventory_adjustment;`);
  }
}

