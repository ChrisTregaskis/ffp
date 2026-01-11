ALTER TABLE "assessment_templates" ALTER COLUMN "scoring_config" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_flows" ADD COLUMN "scoring_config" jsonb;