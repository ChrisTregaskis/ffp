import { z } from 'zod';

import { VIDEO_STATUSES, DIFFICULTIES } from '@ffp/database/constants';

import { publicIdSchema } from '../public-id.schema';
import { videoTagAssignmentSchema } from '../tag.schema';

export const videoStatusSchema = z.enum(VIDEO_STATUSES);
export const difficultySchema = z.enum(DIFFICULTIES);

/** A video record, without the columns typed tags replace */
export const videoSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  publicId: publicIdSchema,
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
  /** Required equipment (e.g., ['resistance_band', 'yoga_mat'] or ['none']) */
  equipment: z.array(z.string().min(1)),
  /** Curation signal: a core exercise, favoured over the rest of its pool */
  isEssential: z.boolean(),
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
    equipment: true,
  })
  .extend({
    description: videoSchema.shape.description.optional(),
    mimeType: videoSchema.shape.mimeType.optional().default('video/mp4'),
    status: videoSchema.shape.status.optional().default('draft'),
    difficulty: videoSchema.shape.difficulty.optional(),
    tags: videoTagAssignmentSchema.optional(),
    defaultSets: videoSchema.shape.defaultSets.optional(),
    defaultReps: videoSchema.shape.defaultReps.optional(),
    defaultDurationSeconds: videoSchema.shape.defaultDurationSeconds.optional(),
    defaultRestSeconds: videoSchema.shape.defaultRestSeconds.optional(),
    defaultNotes: videoSchema.shape.defaultNotes.optional(),
  });

/**
 * A replacement's key must be one the upload URL issues (`library/{uuid}.mp4`), because saving
 * it deletes the current file: a mistyped or placeholder key would leave the record with none.
 */
const uploadedVideoKeySchema = z
  .string()
  .regex(/^library\/[0-9a-f-]{36}\.mp4$/, 'Video key must come from an upload');

/** Schema for updating video metadata and media properties (all partial) */
export const updateVideoSchema = videoSchema
  .pick({
    title: true,
    description: true,
    s3Key: true,
    durationSeconds: true,
    fileSizeBytes: true,
    mimeType: true,
    status: true,
    difficulty: true,
    equipment: true,
    defaultSets: true,
    defaultReps: true,
    defaultDurationSeconds: true,
    defaultRestSeconds: true,
    defaultNotes: true,
  })
  .partial()
  .extend({ s3Key: uploadedVideoKeySchema.optional(), tags: videoTagAssignmentSchema.optional() });

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type Video = z.infer<typeof videoSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
