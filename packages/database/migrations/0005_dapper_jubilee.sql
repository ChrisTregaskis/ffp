CREATE TYPE "public"."job_status" AS ENUM(
	'queued',
	'processing',
	'completed',
	'failed',
	'cancelled'
);

--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('score_assessment', 'generate_program');

--> statement-breakpoint
CREATE TABLE "process_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"priority" integer DEFAULT 4 NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"retry_after" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);

--> statement-breakpoint
ALTER TABLE
	"process_jobs"
ADD
	CONSTRAINT "process_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX "idx_process_jobs_status" ON "process_jobs" USING btree ("status");

--> statement-breakpoint
CREATE INDEX "idx_process_jobs_type_status" ON "process_jobs" USING btree ("type", "status");

--> statement-breakpoint
CREATE INDEX "idx_process_jobs_priority" ON "process_jobs" USING btree ("priority");

--> statement-breakpoint
CREATE INDEX "idx_process_jobs_tenant" ON "process_jobs" USING btree ("tenant_id");