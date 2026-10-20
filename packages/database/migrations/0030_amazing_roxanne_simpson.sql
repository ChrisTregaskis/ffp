CREATE TABLE "user_session_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_session_id" uuid NOT NULL,
	"source_session_exercise_id" uuid,
	"video_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"sets" integer DEFAULT 3 NOT NULL,
	"reps" varchar(20) DEFAULT '10' NOT NULL,
	"duration_seconds" integer,
	"rest_seconds" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_session_exercises" ADD CONSTRAINT "user_session_exercises_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session_exercises" ADD CONSTRAINT "user_session_exercises_user_session_id_user_sessions_id_fk" FOREIGN KEY ("user_session_id") REFERENCES "public"."user_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session_exercises" ADD CONSTRAINT "user_session_exercises_source_session_exercise_id_session_exercises_id_fk" FOREIGN KEY ("source_session_exercise_id") REFERENCES "public"."session_exercises"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session_exercises" ADD CONSTRAINT "user_session_exercises_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_session_exercises_session_order" ON "user_session_exercises" USING btree ("user_session_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_user_session_exercises_organisation" ON "user_session_exercises" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "idx_user_session_exercises_session" ON "user_session_exercises" USING btree ("user_session_id");--> statement-breakpoint
CREATE INDEX "idx_user_session_exercises_video" ON "user_session_exercises" USING btree ("video_id");--> statement-breakpoint
-- Backfill: every programme phase gets a user session for each template session it does not yet have.
INSERT INTO "user_sessions" ("organisation_id", "programme_phase_id", "template_session_id", "session_number", "status")
SELECT pp."organisation_id", pp."id", ts."id", ts."session_number", 'not_started'
FROM "programme_phases" pp
JOIN "template_sessions" ts ON ts."template_phase_id" = pp."template_phase_id"
WHERE NOT EXISTS (
	SELECT 1 FROM "user_sessions" us
	WHERE us."programme_phase_id" = pp."id" AND us."template_session_id" = ts."id"
);--> statement-breakpoint
-- Backfill: copy each user session's current template exercises into the member layer.
INSERT INTO "user_session_exercises" ("organisation_id", "user_session_id", "source_session_exercise_id", "video_id", "order_index", "sets", "reps", "duration_seconds", "rest_seconds", "notes")
SELECT us."organisation_id", us."id", se."id", se."video_id", se."order_index", se."sets", se."reps", se."duration_seconds", se."rest_seconds", se."notes"
FROM "user_sessions" us
JOIN "session_exercises" se ON se."template_session_id" = us."template_session_id";