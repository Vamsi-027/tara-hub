CREATE TYPE "public"."image_type" AS ENUM('main', 'detail', 'swatch', 'room', 'texture', 'pattern');--> statement-breakpoint
CREATE TABLE "fabric_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fabric_id" uuid NOT NULL,
	"url" text NOT NULL,
	"r2_key" varchar(500) NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_filename" varchar(255),
	"mime_type" varchar(50) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"type" "image_type" DEFAULT 'detail',
	"order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"alt" text,
	"caption" text,
	"is_processed" boolean DEFAULT false NOT NULL,
	"thumbnail_url" text,
	"thumbnail_r2_key" varchar(500),
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"modified_by" uuid,
	"modified_at" timestamp,
	"deleted_at" timestamp,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."fabric_status";--> statement-breakpoint
CREATE TYPE "public"."fabric_status" AS ENUM('Active', 'Discontinued', 'Out of Stock', 'Coming Soon', 'Sale', 'Clearance');--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."fabric_status";--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "status" SET DATA TYPE "public"."fabric_status" USING "status"::"public"."fabric_status";--> statement-breakpoint
ALTER TABLE "fabric_images" ADD CONSTRAINT "fabric_images_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fabric_images_fabric_id_idx" ON "fabric_images" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "fabric_images_r2_key_idx" ON "fabric_images" USING btree ("r2_key");--> statement-breakpoint
CREATE INDEX "fabric_images_type_idx" ON "fabric_images" USING btree ("type");--> statement-breakpoint
CREATE INDEX "fabric_images_order_idx" ON "fabric_images" USING btree ("order");--> statement-breakpoint
CREATE INDEX "fabric_images_deleted_at_idx" ON "fabric_images" USING btree ("deleted_at");