/**
 * Migration: Create webhook events tracking table
 *
 * This table tracks processed webhook events to prevent duplicate processing.
 * Used for idempotency in webhook handlers.
 */

import { Migration } from "@mikro-orm/migrations"

export class CreateWebhookEventsTable20250928000001 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "processed_webhook_event" (
        "id" character varying NOT NULL,
        "stripe_event_id" character varying NOT NULL,
        "event_type" character varying NOT NULL,
        "processed_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "processed_webhook_event_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "processed_webhook_event_stripe_event_id_unique" UNIQUE ("stripe_event_id")
      );
    `)

    this.addSql(`
      CREATE INDEX "processed_webhook_event_stripe_event_id_index"
      ON "processed_webhook_event" ("stripe_event_id");
    `)

    this.addSql(`
      CREATE INDEX "processed_webhook_event_event_type_index"
      ON "processed_webhook_event" ("event_type");
    `)

    this.addSql(`
      CREATE INDEX "processed_webhook_event_processed_at_index"
      ON "processed_webhook_event" ("processed_at");
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "processed_webhook_event";`)
  }
}