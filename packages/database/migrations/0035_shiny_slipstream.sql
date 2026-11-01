-- Edited after generation: the unique keys come first, because the composite foreign keys
-- reference them, and the two SET NULL keys name their link column, so a deleted programme
-- clears the link but never the row's NOT NULL organisation_id (PostgreSQL 15+).
ALTER TABLE "locations" ADD CONSTRAINT "locations_id_organisation_id_unique" UNIQUE("id","organisation_id");
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_organisation_id_unique" UNIQUE("id","organisation_id");
--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_id_organisation_id_unique" UNIQUE("id","organisation_id");
--> statement-breakpoint
ALTER TABLE "programme_phases" ADD CONSTRAINT "programme_phases_id_organisation_id_unique" UNIQUE("id","organisation_id");
--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_id_organisation_id_unique" UNIQUE("id","organisation_id");
--> statement-breakpoint
ALTER TABLE "user_session_exercises" ADD CONSTRAINT "user_session_exercises_id_organisation_id_unique" UNIQUE("id","organisation_id");
--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_id_organisation_id_unique" UNIQUE("id","organisation_id");
--> statement-breakpoint
ALTER TABLE "assessment_safety_triggers" DROP CONSTRAINT "assessment_safety_triggers_user_assessment_id_user_assessments_id_fk";
--> statement-breakpoint
ALTER TABLE "assessment_safety_triggers" DROP CONSTRAINT "assessment_safety_triggers_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_completions" DROP CONSTRAINT "exercise_completions_user_session_id_user_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "exercise_completions" DROP CONSTRAINT "exercise_completions_user_session_exercise_id_user_session_exercises_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_location_id_locations_id_fk";
--> statement-breakpoint
ALTER TABLE "programmes" DROP CONSTRAINT "programmes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "programmes" DROP CONSTRAINT "programmes_replaced_by_programme_id_programmes_id_fk";
--> statement-breakpoint
ALTER TABLE "programme_phases" DROP CONSTRAINT "programme_phases_programme_id_programmes_id_fk";
--> statement-breakpoint
ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_programme_phase_id_programme_phases_id_fk";
--> statement-breakpoint
ALTER TABLE "user_session_exercises" DROP CONSTRAINT "user_session_exercises_user_session_id_user_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assessments" DROP CONSTRAINT "user_assessments_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assessments" DROP CONSTRAINT "user_assessments_programme_id_programmes_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assessment_answers" DROP CONSTRAINT "user_assessment_answers_user_assessment_id_user_assessments_id_fk";
--> statement-breakpoint
ALTER TABLE "assessment_safety_triggers" ADD CONSTRAINT "assessment_safety_triggers_user_assessment_id_organisation_fk" FOREIGN KEY ("user_assessment_id","organisation_id") REFERENCES "public"."user_assessments"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "assessment_safety_triggers" ADD CONSTRAINT "assessment_safety_triggers_user_id_organisation_fk" FOREIGN KEY ("user_id","organisation_id") REFERENCES "public"."users"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "exercise_completions" ADD CONSTRAINT "exercise_completions_user_session_id_organisation_fk" FOREIGN KEY ("user_session_id","organisation_id") REFERENCES "public"."user_sessions"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "exercise_completions" ADD CONSTRAINT "exercise_completions_user_session_exercise_id_organisation_fk" FOREIGN KEY ("user_session_exercise_id","organisation_id") REFERENCES "public"."user_session_exercises"("id","organisation_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_location_id_organisation_fk" FOREIGN KEY ("location_id","organisation_id") REFERENCES "public"."locations"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_user_id_organisation_fk" FOREIGN KEY ("user_id","organisation_id") REFERENCES "public"."users"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_replaced_by_programme_id_organisation_fk" FOREIGN KEY ("replaced_by_programme_id","organisation_id") REFERENCES "public"."programmes"("id","organisation_id") ON DELETE SET NULL ("replaced_by_programme_id") ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "programme_phases" ADD CONSTRAINT "programme_phases_programme_id_organisation_fk" FOREIGN KEY ("programme_id","organisation_id") REFERENCES "public"."programmes"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_programme_phase_id_organisation_fk" FOREIGN KEY ("programme_phase_id","organisation_id") REFERENCES "public"."programme_phases"("id","organisation_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_session_exercises" ADD CONSTRAINT "user_session_exercises_user_session_id_organisation_fk" FOREIGN KEY ("user_session_id","organisation_id") REFERENCES "public"."user_sessions"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_user_id_organisation_fk" FOREIGN KEY ("user_id","organisation_id") REFERENCES "public"."users"("id","organisation_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_assessments" ADD CONSTRAINT "user_assessments_programme_id_organisation_fk" FOREIGN KEY ("programme_id","organisation_id") REFERENCES "public"."programmes"("id","organisation_id") ON DELETE SET NULL ("programme_id") ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user_assessment_answers" ADD CONSTRAINT "user_assessment_answers_user_assessment_id_organisation_fk" FOREIGN KEY ("user_assessment_id","organisation_id") REFERENCES "public"."user_assessments"("id","organisation_id") ON DELETE cascade ON UPDATE no action;