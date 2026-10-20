ALTER TABLE "exercise_completions" ADD COLUMN "user_session_exercise_id" uuid;--> statement-breakpoint
ALTER TABLE "exercise_completions" ADD CONSTRAINT "exercise_completions_user_session_exercise_id_user_session_exercises_id_fk" FOREIGN KEY ("user_session_exercise_id") REFERENCES "public"."user_session_exercises"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
-- Backfill: point each completion at the member's copy of the exercise it completes.
UPDATE "exercise_completions" ec
SET "user_session_exercise_id" = mse."id"
FROM "user_session_exercises" mse
WHERE mse."user_session_id" = ec."user_session_id"
	AND mse."source_session_exercise_id" = ec."session_exercise_id";