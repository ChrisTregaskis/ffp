import { z } from 'zod';

import { VIDEO_STATUSES, DIFFICULTIES, MOVEMENT_TYPES } from '@ffp/database/constants';

export const videoStatusSchema = z.enum(VIDEO_STATUSES);
export const difficultySchema = z.enum(DIFFICULTIES);
export const movementTypeSchema = z.enum(MOVEMENT_TYPES);

/** Full video record — maps to the videos database table */
export const videoSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Public identifier for URLs (nanoid, 12 chars) */
  publicId: z.string().length(12),
  /** Display title (e.g., "Seated Hamstring Stretch") */
  title: z.string().min(1).max(255),
  /** Detailed exercise instructions */
  description: z.string().nullable(),
  /** S3 object key (e.g., 'library/{uuid}.mp4') — not a full URL */
  s3Key: z.string().min(1).max(500),
  /** Video duration in seconds */
  durationSeconds: z.number().int().nonnegative(),
  /** File size in bytes */
  fileSizeBytes: z.number().int().nonnegative(),
  /** MIME type (e.g., 'video/mp4') */
  mimeType: z.string().min(1).max(50),
  /** Video catalogue status */
  status: videoStatusSchema,
  /** Exercise difficulty level (nullable — not relevant for informational videos) */
  difficulty: difficultySchema.nullable(),
  /** Type of movement (nullable — not relevant for informational videos) */
  movementType: movementTypeSchema.nullable(),
  /** Target body parts (e.g., ['hamstrings', 'lower_back', 'glutes']) */
  bodyParts: z.array(z.string().min(1)),
  /** Required equipment (e.g., ['resistance_band', 'yoga_mat'] or ['none']) */
  equipment: z.array(z.string().min(1)),
  /** Flexible tags for filtering (e.g., ['post-surgery', 'knee', 'warm-up']) */
  tags: z.array(z.string().min(1)),
  /** Default number of sets when used as an exercise (e.g., 3) */
  defaultSets: z.number().int().positive().nullable(),
  /** Default reps — supports ranges (e.g., '8-12', '10') */
  defaultReps: z.string().max(20).nullable(),
  /** Default duration in seconds (e.g., 30 for a 30-second hold) */
  defaultDurationSeconds: z.number().int().positive().nullable(),
  /** Default rest period in seconds between sets (e.g., 60) */
  defaultRestSeconds: z.number().int().positive().nullable(),
  /** Default exercise notes (e.g., 'Keep core engaged throughout') */
  defaultNotes: z.string().nullable(),
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

/** Schema for creating a new video record (admin upload) */
export const createVideoSchema = videoSchema
  .pick({
    title: true,
    s3Key: true,
    durationSeconds: true,
    fileSizeBytes: true,
    bodyParts: true,
    equipment: true,
  })
  .extend({
    description: videoSchema.shape.description.optional(),
    mimeType: videoSchema.shape.mimeType.optional().default('video/mp4'),
    status: videoSchema.shape.status.optional().default('draft'),
    difficulty: videoSchema.shape.difficulty.optional(),
    movementType: videoSchema.shape.movementType.optional(),
    tags: videoSchema.shape.tags.optional().default([]),
    defaultSets: videoSchema.shape.defaultSets.optional(),
    defaultReps: videoSchema.shape.defaultReps.optional(),
    defaultDurationSeconds: videoSchema.shape.defaultDurationSeconds.optional(),
    defaultRestSeconds: videoSchema.shape.defaultRestSeconds.optional(),
    defaultNotes: videoSchema.shape.defaultNotes.optional(),
  });

/** Schema for updating video metadata (partial — media properties are immutable) */
export const updateVideoSchema = videoSchema
  .pick({
    title: true,
    description: true,
    status: true,
    difficulty: true,
    movementType: true,
    bodyParts: true,
    equipment: true,
    tags: true,
    defaultSets: true,
    defaultReps: true,
    defaultDurationSeconds: true,
    defaultRestSeconds: true,
    defaultNotes: true,
  })
  .partial();

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type MovementType = z.infer<typeof movementTypeSchema>;
export type Video = z.infer<typeof videoSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
