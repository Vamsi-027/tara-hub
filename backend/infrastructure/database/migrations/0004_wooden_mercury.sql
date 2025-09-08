CREATE TABLE "login_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"success" boolean NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification_tokens" DROP CONSTRAINT "verification_tokens_identifier_token_pk";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hashed_password" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "two_factor_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_status" text DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "used" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;