ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
UPDATE "users" SET "role" = 'programme_user' WHERE "role" = 'program_user';--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('system_admin', 'customer_owner', 'customer_admin', 'programme_user');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "process_jobs" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "process_jobs" SET "type" = 'generate_programme' WHERE "type" = 'generate_program';--> statement-breakpoint
DROP TYPE "public"."job_type";--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('score_assessment', 'generate_programme');--> statement-breakpoint
ALTER TABLE "process_jobs" ALTER COLUMN "type" SET DATA TYPE "public"."job_type" USING "type"::"public"."job_type";