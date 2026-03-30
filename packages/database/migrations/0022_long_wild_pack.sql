CREATE TYPE "public"."session_status" AS ENUM(
	'not_started',
	'in_progress',
	'completed',
	'skipped'
);

--> statement-breakpoint
CREATE TABLE "exercise_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_session_id" uuid NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"video_id" uuid NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"skipped" boolean DEFAULT false NOT NULL,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"programme_phase_id" uuid NOT NULL,
	"template_session_id" uuid NOT NULL,
	"session_number" integer NOT NULL,
	"status" "session_status" DEFAULT 'not_started' NOT NULL,
	"paused_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"skipped_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint
ALTER TABLE
	"exercise_completions"
ADD
	CONSTRAINT "exercise_completions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"exercise_completions"
ADD
	CONSTRAINT "exercise_completions_user_session_id_user_sessions_id_fk" FOREIGN KEY ("user_session_id") REFERENCES "public"."user_sessions"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"exercise_completions"
ADD
	CONSTRAINT "exercise_completions_session_exercise_id_session_exercises_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."session_exercises"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"exercise_completions"
ADD
	CONSTRAINT "exercise_completions_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"user_sessions"
ADD
	CONSTRAINT "user_sessions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"user_sessions"
ADD
	CONSTRAINT "user_sessions_programme_phase_id_programme_phases_id_fk" FOREIGN KEY ("programme_phase_id") REFERENCES "public"."programme_phases"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	"user_sessions"
ADD
	CONSTRAINT "user_sessions_template_session_id_template_sessions_id_fk" FOREIGN KEY ("template_session_id") REFERENCES "public"."template_sessions"("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
CREATE UNIQUE INDEX "idx_exercise_completions_session_exercise" ON "exercise_completions" USING btree ("user_session_id", "session_exercise_id");

--> statement-breakpoint
CREATE INDEX "idx_exercise_completions_organisation" ON "exercise_completions" USING btree ("organisation_id");

--> statement-breakpoint
CREATE INDEX "idx_exercise_completions_session" ON "exercise_completions" USING btree ("user_session_id");

--> statement-breakpoint
CREATE INDEX "idx_exercise_completions_video" ON "exercise_completions" USING btree ("video_id");

--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_sessions_phase_session" ON "user_sessions" USING btree ("programme_phase_id", "session_number");

--> statement-breakpoint
CREATE INDEX "idx_user_sessions_organisation" ON "user_sessions" USING btree ("organisation_id");

--> statement-breakpoint
CREATE INDEX "idx_user_sessions_programme_phase" ON "user_sessions" USING btree ("programme_phase_id");
