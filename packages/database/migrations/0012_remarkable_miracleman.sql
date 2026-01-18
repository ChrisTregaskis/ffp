CREATE TYPE "public"."flow_step_type" AS ENUM('intro', 'questions', 'transition', 'video-assessment', 'results', 'programme-overview');--> statement-breakpoint
CREATE TABLE "flow_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flow_id" uuid NOT NULL,
	"template_id" uuid,
	"order" integer NOT NULL,
	"type" "flow_step_type" NOT NULL,
	"config" jsonb NOT NULL,
	"next_step_rules" jsonb,
	"default_next_step_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flow_steps" ADD CONSTRAINT "flow_steps_flow_id_assessment_flows_id_fk" FOREIGN KEY ("flow_id") REFERENCES "public"."assessment_flows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flow_steps" ADD CONSTRAINT "flow_steps_template_id_assessment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_flow_steps_flow_id" ON "flow_steps" USING btree ("flow_id");--> statement-breakpoint
CREATE INDEX "idx_flow_steps_flow_order" ON "flow_steps" USING btree ("flow_id","order");