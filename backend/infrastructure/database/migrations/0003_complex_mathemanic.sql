CREATE TYPE "public"."fabric_status" AS ENUM('active', 'inactive', 'discontinued', 'coming_soon', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."fabric_type" AS ENUM('Upholstery', 'Drapery', 'Multi-Purpose', 'Outdoor', 'Sheer', 'Blackout');--> statement-breakpoint
CREATE TYPE "public"."durability_rating" AS ENUM('Light Duty', 'Medium Duty', 'Heavy Duty', 'Extra Heavy Duty');--> statement-breakpoint
CREATE TABLE "fabrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(50) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "fabric_type" NOT NULL,
	"status" "fabric_status" DEFAULT 'active' NOT NULL,
	"pattern" varchar(100),
	"primary_color" varchar(50),
	"color_hex" varchar(7),
	"color_family" varchar(50),
	"secondary_colors" jsonb,
	"manufacturer_id" uuid,
	"manufacturer_name" varchar(255) NOT NULL,
	"collection" varchar(255),
	"designer_name" varchar(255),
	"country_of_origin" varchar(100),
	"retail_price" numeric(10, 2) NOT NULL,
	"wholesale_price" numeric(10, 2),
	"cost_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"price_unit" varchar(20) DEFAULT 'per_yard' NOT NULL,
	"width" numeric(6, 2) NOT NULL,
	"width_unit" varchar(10) DEFAULT 'inches' NOT NULL,
	"weight" numeric(6, 2),
	"weight_unit" varchar(10) DEFAULT 'oz/yd',
	"thickness" numeric(4, 2),
	"fiber_content" jsonb,
	"backing_type" varchar(100),
	"finish_treatment" text,
	"durability_rating" "durability_rating",
	"martindale" integer,
	"wyzenbeek" integer,
	"lightfastness" integer,
	"pilling_resistance" integer,
	"is_stain_resistant" boolean DEFAULT false,
	"is_fade_resistant" boolean DEFAULT false,
	"is_water_resistant" boolean DEFAULT false,
	"is_pet_friendly" boolean DEFAULT false,
	"is_outdoor_safe" boolean DEFAULT false,
	"is_fire_retardant" boolean DEFAULT false,
	"is_bleach_cleanable" boolean DEFAULT false,
	"is_antimicrobial" boolean DEFAULT false,
	"stock_quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"reserved_quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"available_quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
	"minimum_order" numeric(6, 2) DEFAULT '1' NOT NULL,
	"increment_quantity" numeric(6, 2) DEFAULT '1',
	"reorder_point" numeric(10, 2),
	"reorder_quantity" numeric(10, 2),
	"lead_time_days" integer,
	"is_custom_order" boolean DEFAULT false,
	"warehouse_location" varchar(50),
	"bin_location" varchar(50),
	"roll_count" integer DEFAULT 0,
	"care_instructions" jsonb,
	"cleaning_code" varchar(10),
	"thumbnail_url" text,
	"main_image_url" text,
	"images" jsonb,
	"swatch_image_url" text,
	"texture_image_url" text,
	"certifications" jsonb,
	"flammability_standard" varchar(100),
	"environmental_rating" varchar(50),
	"meta_title" varchar(255),
	"meta_description" text,
	"slug" varchar(255),
	"tags" jsonb,
	"search_keywords" text,
	"is_featured" boolean DEFAULT false,
	"is_new_arrival" boolean DEFAULT false,
	"is_best_seller" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"favorite_count" integer DEFAULT 0,
	"sample_request_count" integer DEFAULT 0,
	"last_viewed_at" timestamp,
	"internal_notes" text,
	"public_notes" text,
	"warranty_info" text,
	"return_policy" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" uuid,
	"deleted_at" timestamp,
	"deleted_by" uuid,
	CONSTRAINT "fabrics_sku_unique" UNIQUE("sku"),
	CONSTRAINT "fabrics_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "fabric_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fabric_id" uuid NOT NULL,
	"retail_price" numeric(10, 2) NOT NULL,
	"wholesale_price" numeric(10, 2),
	"effective_date" timestamp NOT NULL,
	"expiry_date" timestamp,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
CREATE TABLE "fabric_stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fabric_id" uuid NOT NULL,
	"movement_type" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"balance_before" numeric(10, 2) NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"reference_type" text,
	"reference_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "fabric_price_history" ADD CONSTRAINT "fabric_price_history_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_stock_movements" ADD CONSTRAINT "fabric_stock_movements_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fabrics_sku" ON "fabrics" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_fabrics_slug" ON "fabrics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_fabrics_name" ON "fabrics" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_fabrics_status" ON "fabrics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_fabrics_type" ON "fabrics" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_fabrics_manufacturer" ON "fabrics" USING btree ("manufacturer_name");--> statement-breakpoint
CREATE INDEX "idx_fabrics_collection" ON "fabrics" USING btree ("collection");--> statement-breakpoint
CREATE INDEX "idx_fabrics_price" ON "fabrics" USING btree ("retail_price");--> statement-breakpoint
CREATE INDEX "idx_fabrics_stock" ON "fabrics" USING btree ("available_quantity");--> statement-breakpoint
CREATE INDEX "idx_fabrics_deleted_at" ON "fabrics" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_fabrics_type_status" ON "fabrics" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "idx_fabrics_manufacturer_collection" ON "fabrics" USING btree ("manufacturer_name","collection");--> statement-breakpoint
CREATE INDEX "idx_fabrics_status_stock" ON "fabrics" USING btree ("status","available_quantity");--> statement-breakpoint
CREATE INDEX "idx_fabrics_featured_order" ON "fabrics" USING btree ("is_featured","display_order");--> statement-breakpoint
CREATE INDEX "idx_fabrics_search" ON "fabrics" USING gin (to_tsvector('english', 
      "name" || ' ' || 
      COALESCE("description", '') || ' ' || 
      COALESCE("pattern", '') || ' ' || 
      COALESCE("primary_color", '') || ' ' ||
      COALESCE("manufacturer_name", '') || ' ' ||
      COALESCE("collection", '') || ' ' ||
      COALESCE("search_keywords", '')
    ));--> statement-breakpoint
CREATE INDEX "idx_price_history_fabric" ON "fabric_price_history" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "idx_price_history_date" ON "fabric_price_history" USING btree ("effective_date");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_fabric" ON "fabric_stock_movements" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_date" ON "fabric_stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_type" ON "fabric_stock_movements" USING btree ("movement_type");