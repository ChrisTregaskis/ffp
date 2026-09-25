-- Re-cut score_dimension to activity, age, strength, mobility, balance.
-- Hand-edited: Postgres cannot drop enum values, so the type is recreated, and
-- questions still carrying a removed value (pain, general) are set to NULL
-- before the cast, which would otherwise fail on them.
ALTER TABLE "questions" ALTER COLUMN "score_dimension" SET DATA TYPE text;--> statement-breakpoint
UPDATE "questions" SET "score_dimension" = NULL WHERE "score_dimension" IN ('pain', 'general');--> statement-breakpoint
DROP TYPE "public"."score_dimension";--> statement-breakpoint
CREATE TYPE "public"."score_dimension" AS ENUM('activity', 'age', 'strength', 'mobility', 'balance');--> statement-breakpoint
ALTER TABLE "questions" ALTER COLUMN "score_dimension" SET DATA TYPE "public"."score_dimension" USING "score_dimension"::"public"."score_dimension";
