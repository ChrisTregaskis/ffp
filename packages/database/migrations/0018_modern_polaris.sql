CREATE TYPE "public"."phase_status" AS ENUM('not_started', 'in_progress', 'completed');

--> statement-breakpoint
CREATE TABLE "template_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_template_id" uuid NOT NULL,
	"phase_number" integer NOT NULL,
	"name" varchar(255),
	"description" text,
	"session_count" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "template_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_phase_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"name" varchar(255),
	"description" text,
	"estimated_duration_minutes" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_session_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"reps" varchar(20) DEFAULT '10' NOT NULL,
	"duration_seconds" integer,
	"rest_seconds" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "programme_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"programme_id" uuid NOT NULL,
	"template_phase_id" uuid NOT NULL,
	"phase_number" integer NOT NULL,
	"name" varchar(255),
	"status" "phase_status" DEFAULT 'not_started' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"programme_templates"
ADD
	COLUMN "total_phases" integer DEFAULT 12 NOT NULL;

--> statement-breakpoint
ALTER TABLE
	"programme_templates"
ADD
	COLUMN "sessions_per_phase" integer DEFAULT 3 NOT NULL;

--> statement-breakpoint
ALTER TABLE
	"programme_templates"
ADD
	COLUMN "difficulty" "difficulty" DEFAULT 'beginner' NOT NULL;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	COLUMN "started_at" timestamp;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	COLUMN "completed_at" timestamp;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	COLUMN "archived_at" timestamp;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	COLUMN "archived_reason" varchar(50);

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	COLUMN "replaced_by_programme_id" uuid;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	COLUMN "total_phases" integer;

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	COLUMN "sessions_per_phase" integer;

--> statement-breakpoint
ALTER TABLE
	"template_phases"
ADD
	CONSTRAINT "template_phases_programme_template_id_programme_templates_id_fk" FOREIGN KEY ("programme_template_id") REFERENCES "public"."programme_templates"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"template_sessions"
ADD
	CONSTRAINT "template_sessions_template_phase_id_template_phases_id_fk" FOREIGN KEY ("template_phase_id") REFERENCES "public"."template_phases"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"session_exercises"
ADD
	CONSTRAINT "session_exercises_template_session_id_template_sessions_id_fk" FOREIGN KEY ("template_session_id") REFERENCES "public"."template_sessions"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"session_exercises"
ADD
	CONSTRAINT "session_exercises_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"programme_phases"
ADD
	CONSTRAINT "programme_phases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"programme_phases"
ADD
	CONSTRAINT "programme_phases_programme_id_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programmes"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"programme_phases"
ADD
	CONSTRAINT "programme_phases_template_phase_id_template_phases_id_fk" FOREIGN KEY ("template_phase_id") REFERENCES "public"."template_phases"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_phases_template_phase" ON "template_phases" USING btree ("programme_template_id", "phase_number");

--> statement-breakpoint
CREATE INDEX "idx_template_phases_template" ON "template_phases" USING btree ("programme_template_id");

--> statement-breakpoint
CREATE UNIQUE INDEX "idx_template_sessions_phase_session" ON "template_sessions" USING btree ("template_phase_id", "session_number");

--> statement-breakpoint
CREATE INDEX "idx_template_sessions_phase" ON "template_sessions" USING btree ("template_phase_id");

--> statement-breakpoint
CREATE UNIQUE INDEX "idx_session_exercises_session_order" ON "session_exercises" USING btree ("template_session_id", "order_index");

--> statement-breakpoint
CREATE INDEX "idx_session_exercises_session" ON "session_exercises" USING btree ("template_session_id");

--> statement-breakpoint
CREATE INDEX "idx_session_exercises_video" ON "session_exercises" USING btree ("video_id");

--> statement-breakpoint
CREATE UNIQUE INDEX "idx_programme_phases_programme_phase" ON "programme_phases" USING btree ("programme_id", "phase_number");

--> statement-breakpoint
CREATE INDEX "idx_programme_phases_tenant" ON "programme_phases" USING btree ("tenant_id");

--> statement-breakpoint
CREATE INDEX "idx_programme_phases_programme" ON "programme_phases" USING btree ("programme_id");

--> statement-breakpoint
ALTER TABLE
	"programmes"
ADD
	CONSTRAINT "programmes_replaced_by_programme_id_programmes_id_fk" FOREIGN KEY ("replaced_by_programme_id") REFERENCES "public"."programmes"("id") ON DELETE
set
	null ON UPDATE no action;