CREATE TYPE "public"."question_type" AS ENUM('single-choice', 'multi-choice', 'numeric', 'text', 'scale', 'video-response');--> statement-breakpoint
CREATE TYPE "public"."score_dimension" AS ENUM('strength', 'balance', 'mobility', 'pain', 'general');--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"type" "question_type" NOT NULL,
	"question_text" text NOT NULL,
	"description" text,
	"options" jsonb,
	"validation" jsonb,
	"video_id" uuid,
	"score_dimension" "score_dimension",
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "questions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "template_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"display_order" integer NOT NULL,
	"config_overrides" jsonb
);
--> statement-breakpoint
CREATE TABLE "user_assessment_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_assessment_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_value" jsonb NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_template_id_assessment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."assessment_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_questions" ADD CONSTRAINT "template_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessment_answers" ADD CONSTRAINT "user_assessment_answers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessment_answers" ADD CONSTRAINT "user_assessment_answers_user_assessment_id_user_assessments_id_fk" FOREIGN KEY ("user_assessment_id") REFERENCES "public"."user_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assessment_answers" ADD CONSTRAINT "user_assessment_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_questions_slug" ON "questions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_questions_type" ON "questions" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_questions_is_active" ON "questions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_questions_template_question" ON "template_questions" USING btree ("template_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_questions_template_order" ON "template_questions" USING btree ("template_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_template_questions_template" ON "template_questions" USING btree ("template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_assessment_answers_assessment_question" ON "user_assessment_answers" USING btree ("user_assessment_id","question_id");--> statement-breakpoint
CREATE INDEX "idx_user_assessment_answers_tenant" ON "user_assessment_answers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_user_assessment_answers_assessment" ON "user_assessment_answers" USING btree ("user_assessment_id");