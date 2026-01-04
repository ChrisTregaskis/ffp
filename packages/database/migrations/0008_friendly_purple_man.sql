CREATE TYPE "public"."user_assessment_status" AS ENUM('not_started', 'in_progress', 'submitted', 'scored', 'completed', 'abandoned');--> statement-breakpoint
CREATE TABLE "user_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"flow_id" uuid NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"status" "user_assessment_status" DEFAULT 'not_started' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scores" jsonb,
	"programme_id" uuid,
	"started_at" timestamp,
	"submitted_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_flow_id_assessment_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."assessment_flows"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_assessments_tenant_user" ON "user_assessments" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_user_assessments_status" ON "user_assessments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_assessments_flow" ON "user_assessments" USING btree ("flow_id");