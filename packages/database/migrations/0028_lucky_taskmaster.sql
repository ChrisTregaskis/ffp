CREATE TABLE "assessment_safety_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_assessment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"question_slug" text NOT NULL,
	"selected_options" jsonb NOT NULL,
	"warning_message" text NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_assessments" ADD COLUMN "safety_acknowledged_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_safety_triggers" ADD CONSTRAINT "assessment_safety_triggers_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_safety_triggers" ADD CONSTRAINT "assessment_safety_triggers_user_assessment_id_user_assessments_id_fk" FOREIGN KEY ("user_assessment_id") REFERENCES "public"."user_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_safety_triggers" ADD CONSTRAINT "assessment_safety_triggers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_assessment_safety_triggers_assessment" ON "assessment_safety_triggers" USING btree ("user_assessment_id");--> statement-breakpoint
CREATE INDEX "idx_assessment_safety_triggers_organisation" ON "assessment_safety_triggers" USING btree ("organisation_id");