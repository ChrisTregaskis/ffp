ALTER TABLE
  "videos"
ADD
  COLUMN "default_sets" integer;

--> statement-breakpoint
ALTER TABLE
  "videos"
ADD
  COLUMN "default_reps" varchar(20);

--> statement-breakpoint
ALTER TABLE
  "videos"
ADD
  COLUMN "default_duration_seconds" integer;

--> statement-breakpoint
ALTER TABLE
  "videos"
ADD
  COLUMN "default_rest_seconds" integer;

--> statement-breakpoint
ALTER TABLE
  "videos"
ADD
  COLUMN "default_notes" text;