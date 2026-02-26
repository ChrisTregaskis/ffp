CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced');

--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('stretch', 'strength', 'mobility', 'balance');

--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('draft', 'active', 'archived');

--> statement-breakpoint
CREATE TABLE "videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"s3_key" varchar(500) NOT NULL,
	"thumbnail_key" varchar(500),
	"duration_seconds" integer NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"mime_type" varchar(50) DEFAULT 'video/mp4' NOT NULL,
	"status" "video_status" DEFAULT 'draft' NOT NULL,
	"difficulty" "difficulty",
	"movement_type" "movement_type",
	"body_parts" text [] NOT NULL,
	"equipment" text [] NOT NULL,
	"tags" text [] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "videos_s3_key_unique" UNIQUE("s3_key")
);

--> statement-breakpoint
CREATE INDEX "idx_videos_status" ON "videos" USING btree ("status");

--> statement-breakpoint
CREATE INDEX "idx_videos_body_parts" ON "videos" USING gin ("body_parts");

--> statement-breakpoint
CREATE INDEX "idx_videos_equipment" ON "videos" USING gin ("equipment");

--> statement-breakpoint
CREATE INDEX "idx_videos_tags" ON "videos" USING gin ("tags");