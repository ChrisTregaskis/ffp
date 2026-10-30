DROP INDEX "idx_videos_body_parts";--> statement-breakpoint
DROP INDEX "idx_videos_tags";--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN "movement_type";--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN "body_parts";--> statement-breakpoint
ALTER TABLE "videos" DROP COLUMN "tags";--> statement-breakpoint
DROP TYPE "public"."movement_type";