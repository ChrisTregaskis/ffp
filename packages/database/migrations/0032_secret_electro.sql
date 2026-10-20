ALTER TABLE "exercise_completions" DROP CONSTRAINT "exercise_completions_session_exercise_id_session_exercises_id_fk";
--> statement-breakpoint
DROP INDEX "idx_exercise_completions_session_exercise";--> statement-breakpoint
ALTER TABLE "exercise_completions" ALTER COLUMN "user_session_exercise_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_exercise_completions_session_exercise" ON "exercise_completions" USING btree ("user_session_id","user_session_exercise_id");--> statement-breakpoint
ALTER TABLE "exercise_completions" DROP COLUMN "session_exercise_id";