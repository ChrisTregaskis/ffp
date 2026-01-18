ALTER TABLE "user_assessments" ADD COLUMN "visited_step_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD COLUMN "warnings_shown" jsonb DEFAULT '[]'::jsonb;