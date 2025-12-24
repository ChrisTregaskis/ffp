-- Create assessment_flows table for configurable assessment journeys
-- No RLS required - system-managed content accessible by all authenticated users

CREATE TABLE IF NOT EXISTS "assessment_flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"steps" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Index for filtering active flows
CREATE INDEX IF NOT EXISTS "idx_assessment_flows_active" ON "assessment_flows" USING btree ("is_active");
