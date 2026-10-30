import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

import { VIDEO_STATUSES, DIFFICULTIES } from '../constants/video.constants';
import { publicIdColumn, publicIdIndex } from '../lib/public-id';

export const videoStatusEnum = pgEnum('video_status', [...VIDEO_STATUSES]);
export const difficultyEnum = pgEnum('difficulty', [...DIFFICULTIES]);

/**
 * Videos table definition
 *
 * System-managed video catalogue — no RLS required.
 * All authenticated users can access the exercise video library.
 * Follows the `programme_templates` pattern (system-managed content).
 *
 * **Indexes optimised for common queries:**
 * - status: Filter catalogue by video status
 * - equipment: GIN index for array containment queries
 */
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    publicId: publicIdColumn(),
    /** Display title (e.g., "Seated Hamstring Stretch") */
    title: varchar('title', { length: 255 }).notNull(),
    /** Detailed exercise instructions */
    description: text('description'),
    /** S3 object key (e.g., 'library/{uuid}.mp4') — not a full URL */
    s3Key: varchar('s3_key', { length: 500 }).notNull().unique(),
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
    /** Required equipment (e.g., ['resistance_band', 'yoga_mat'] or ['none']) */
    equipment: text('equipment').array().notNull(),
    /** Curation signal: a core exercise, favoured over the rest of its pool */
    isEssential: boolean('is_essential').notNull().default(false),
    /** Default number of sets when used as an exercise (e.g., 3) */
    defaultSets: integer('default_sets'),
    /** Default reps — supports ranges (e.g., '8-12', '10') */
    defaultReps: varchar('default_reps', { length: 20 }),
    /** Default duration in seconds (e.g., 30 for a 30-second hold) */
    defaultDurationSeconds: integer('default_duration_seconds'),
    /** Default rest period in seconds between sets (e.g., 60) */
    defaultRestSeconds: integer('default_rest_seconds'),
    /** Default exercise notes (e.g., 'Keep core engaged throughout') */
    defaultNotes: text('default_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    publicIdIndex('videos', table.publicId),
    index('idx_videos_status').on(table.status),
    index('idx_videos_equipment').using('gin', table.equipment),
  ]
);

export type VideoRecord = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
