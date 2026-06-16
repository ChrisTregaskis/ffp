-- Add public_id columns (nullable initially for backfill)
ALTER TABLE "assessment_flows" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "assessment_templates" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "flow_steps" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "public_id" varchar(12);--> statement-breakpoint

-- Backfill existing rows with unique 12-char IDs derived from gen_random_uuid()
UPDATE "assessment_flows" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "assessment_templates" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "flow_steps" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint
UPDATE "questions" SET "public_id" = substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) WHERE "public_id" IS NULL;--> statement-breakpoint

-- Set NOT NULL constraint now that all rows have values
ALTER TABLE "assessment_flows" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_templates" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "flow_steps" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "public_id" SET NOT NULL;--> statement-breakpoint

-- Create unique indexes
CREATE UNIQUE INDEX "idx_assessment_flows_public_id" ON "assessment_flows" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_assessment_templates_public_id" ON "assessment_templates" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_flow_steps_public_id" ON "flow_steps" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_questions_public_id" ON "questions" USING btree ("public_id");
