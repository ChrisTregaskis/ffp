import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { VIDEO_STATUSES, DIFFICULTIES, MOVEMENT_TYPES } from '../constants/video.constants';

export const videoStatusEnum = pgEnum('video_status', [...VIDEO_STATUSES]);
export const difficultyEnum = pgEnum('difficulty', [...DIFFICULTIES]);
export const movementTypeEnum = pgEnum('movement_type', [...MOVEMENT_TYPES]);

/**
 * Videos table definition
 *
 * System-managed video catalogue — no RLS required.
 * All authenticated users can access the exercise video library.
 * Follows the `programme_templates` pattern (system-managed content).
 *
 * **Indexes optimised for common queries:**
 * - status: Filter catalogue by video status
 * - body_parts: GIN index for array containment queries
 * - equipment: GIN index for array containment queries
 * - tags: GIN index for flexible tagging queries
 */
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Display title (e.g., "Seated Hamstring Stretch") */
    title: varchar('title', { length: 255 }).notNull(),
    /** Detailed exercise instructions */
    description: text('description'),
    /** S3 object key (e.g., 'library/{uuid}.mp4') — not a full URL */
    s3Key: varchar('s3_key', { length: 500 }).notNull(),
    /** S3 key for thumbnail image */
    thumbnailKey: varchar('thumbnail_key', { length: 500 }),
    /** Video duration in seconds */
    durationSeconds: integer('duration_seconds').notNull(),
    /** File size in bytes (bigint for large files) */
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
    /** MIME type (e.g., 'video/mp4') */
    mimeType: varchar('mime_type', { length: 50 }).notNull().default('video/mp4'),
    /** Video catalogue status */
    status: videoStatusEnum('status').notNull().default('draft'),
    /** Exercise difficulty level (nullable — not relevant for informational videos) */
    difficulty: difficultyEnum('difficulty'),
    /** Type of movement (nullable — not relevant for informational videos) */
    movementType: movementTypeEnum('movement_type'),
    /** Target body parts (e.g., ['hamstrings', 'lower_back', 'glutes']) */
    bodyParts: text('body_parts').array().notNull(),
    /** Required equipment (e.g., ['resistance_band', 'yoga_mat'] or ['none']) */
    equipment: text('equipment').array().notNull(),
    /** Flexible tags for filtering (e.g., ['post-surgery', 'knee', 'warm-up']) */
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_videos_status').on(table.status),
    index('idx_videos_body_parts').using('gin', table.bodyParts),
    index('idx_videos_equipment').using('gin', table.equipment),
    index('idx_videos_tags').using('gin', table.tags),
  ]
);

export const insertVideoSchema = createInsertSchema(videos);
export const selectVideoSchema = createSelectSchema(videos);
export type VideoRecord = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
