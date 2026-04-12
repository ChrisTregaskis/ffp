-- Add public_id columns (nullable initially for backfill)
ALTER TABLE "organisations" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "locations" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "programme_templates" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "programmes" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "template_phases" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "template_sessions" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "programme_phases" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint

-- Backfill existing rows with unique 12-char IDs derived from gen_random_uuid()
UPDATE "organisations" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "locations" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "users" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "programme_templates" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "programmes" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "template_phases" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "template_sessions" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "programme_phases" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "videos" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint

-- Set NOT NULL constraint now that all rows have values
ALTER TABLE "organisations" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "programme_templates" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "programmes" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "template_phases" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "template_sessions" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "programme_phases" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint

-- Create unique indexes
CREATE UNIQUE INDEX "idx_organisations_public_id" ON "organisations" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_locations_public_id" ON "locations" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_public_id" ON "users" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_programme_templates_public_id" ON "programme_templates" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_programmes_public_id" ON "programmes" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_phases_public_id" ON "template_phases" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_sessions_public_id" ON "template_sessions" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_programme_phases_public_id" ON "programme_phases" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_videos_public_id" ON "videos" USING btree ("public_id");
