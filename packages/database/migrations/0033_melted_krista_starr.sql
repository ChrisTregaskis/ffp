CREATE TABLE "tag_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"label" varchar(100) NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" varchar(12) NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"label" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "videos" ALTER COLUMN "body_parts" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "is_essential" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_category_id_tag_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."tag_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_tags" ADD CONSTRAINT "video_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tag_categories_public_id" ON "tag_categories" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tags_public_id" ON "tags" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tags_category_slug" ON "tags" USING btree ("category_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_video_tags_video_tag" ON "video_tags" USING btree ("video_id","tag_id");--> statement-breakpoint
CREATE INDEX "idx_video_tags_tag_video" ON "video_tags" USING btree ("tag_id","video_id");--> statement-breakpoint
-- Seed the tag categories. Every insert below is idempotent, so the backfill can be re-run.
INSERT INTO "tag_categories" ("public_id", "slug", "label", "display_order")
VALUES
	(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), 'goal', 'Goal', 1),
	(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), 'body-area', 'Body area', 2),
	(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), 'movement', 'Movement', 3),
	(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), 'audience', 'Audience', 4)
ON CONFLICT ("slug") DO NOTHING;--> statement-breakpoint
-- Seed the starting tags: the movement types plus Cardio, the body parts in use, and the free-form tags promoted to a category.
INSERT INTO "tags" ("public_id", "category_id", "slug", "label")
SELECT substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), c."id", v."slug", v."label"
FROM (VALUES
	('movement', 'stretch', 'Stretch'),
	('movement', 'strength', 'Strength'),
	('movement', 'mobility', 'Mobility'),
	('movement', 'balance', 'Balance'),
	('movement', 'cardio', 'Cardio'),
	('body-area', 'ankles', 'Ankles'),
	('body-area', 'biceps', 'Biceps'),
	('body-area', 'calves', 'Calves'),
	('body-area', 'chest', 'Chest'),
	('body-area', 'core', 'Core'),
	('body-area', 'glutes', 'Glutes'),
	('body-area', 'hamstrings', 'Hamstrings'),
	('body-area', 'hip-flexors', 'Hip flexors'),
	('body-area', 'lower-back', 'Lower back'),
	('body-area', 'quadriceps', 'Quadriceps'),
	('body-area', 'shoulders', 'Shoulders'),
	('body-area', 'spine', 'Spine'),
	('body-area', 'triceps', 'Triceps'),
	('body-area', 'upper-back', 'Upper back'),
	('audience', 'beginner-friendly', 'Beginner friendly'),
	('audience', 'gentle', 'Gentle'),
	('audience', 'seated', 'Seated'),
	('goal', 'posture', 'Better posture')
) AS v("category_slug", "slug", "label")
JOIN "tag_categories" c ON c."slug" = v."category_slug"
ON CONFLICT ("category_id", "slug") DO NOTHING;--> statement-breakpoint
-- Any other body part in use becomes a body-area tag too, so no value is lost.
INSERT INTO "tags" ("public_id", "category_id", "slug", "label")
SELECT substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), c."id", b."slug", upper(left(replace(b."slug", '-', ' '), 1)) || substr(replace(b."slug", '-', ' '), 2)
FROM (
	SELECT DISTINCT left(regexp_replace(lower(trim(bp)), '[_[:space:]]+', '-', 'g'), 100) AS "slug"
	FROM "videos", unnest("body_parts") AS bp
	WHERE trim(bp) <> ''
) b
JOIN "tag_categories" c ON c."slug" = 'body-area'
ON CONFLICT ("category_id", "slug") DO NOTHING;--> statement-breakpoint
-- Backfill: each video's movement type becomes a movement tag.
INSERT INTO "video_tags" ("video_id", "tag_id")
SELECT v."id", t."id"
FROM "videos" v
JOIN "tag_categories" c ON c."slug" = 'movement'
JOIN "tags" t ON t."category_id" = c."id" AND t."slug" = v."movement_type"::text
WHERE v."movement_type" IS NOT NULL
ON CONFLICT ("video_id", "tag_id") DO NOTHING;--> statement-breakpoint
-- Backfill: each body part becomes a body-area tag.
INSERT INTO "video_tags" ("video_id", "tag_id")
SELECT DISTINCT v."id", t."id"
FROM "videos" v
CROSS JOIN LATERAL unnest(v."body_parts") AS bp
JOIN "tag_categories" c ON c."slug" = 'body-area'
JOIN "tags" t ON t."category_id" = c."id" AND t."slug" = left(regexp_replace(lower(trim(bp)), '[_[:space:]]+', '-', 'g'), 100)
ON CONFLICT ("video_id", "tag_id") DO NOTHING;--> statement-breakpoint
-- Backfill: free-form tags that map to a category. The rest stay only in the deprecated column.
INSERT INTO "video_tags" ("video_id", "tag_id")
SELECT DISTINCT v."id", t."id"
FROM "videos" v
CROSS JOIN LATERAL unnest(v."tags") AS ft
JOIN (VALUES
	('balance', 'movement', 'balance'),
	('mobility', 'movement', 'mobility'),
	('glutes', 'body-area', 'glutes'),
	('ankle', 'body-area', 'ankles'),
	('spinal', 'body-area', 'spine'),
	('beginner-friendly', 'audience', 'beginner-friendly'),
	('gentle', 'audience', 'gentle'),
	('seated', 'audience', 'seated'),
	('posture', 'goal', 'posture')
) AS m("free_form", "category_slug", "tag_slug") ON m."free_form" = lower(trim(ft))
JOIN "tag_categories" c ON c."slug" = m."category_slug"
JOIN "tags" t ON t."category_id" = c."id" AND t."slug" = m."tag_slug"
ON CONFLICT ("video_id", "tag_id") DO NOTHING;
