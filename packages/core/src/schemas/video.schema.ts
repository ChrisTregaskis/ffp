import { z } from 'zod';

import { VIDEO_STATUSES, DIFFICULTIES, MOVEMENT_TYPES } from '@ffp/database/constants';

export const videoStatusSchema = z.enum(VIDEO_STATUSES);
export const difficultySchema = z.enum(DIFFICULTIES);
export const movementTypeSchema = z.enum(MOVEMENT_TYPES);

/** Full video record — maps to the videos database table */
export const videoSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Display title (e.g., "Seated Hamstring Stretch") */
  title: z.string().min(1).max(255),
  /** Detailed exercise instructions */
  description: z.string().nullable(),
  /** S3 object key (e.g., 'library/{uuid}.mp4') — not a full URL */
  s3Key: z.string().min(1).max(500),
  /** S3 key for thumbnail image */
  thumbnailKey: z.string().max(500).nullable(),
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
    thumbnailKey: videoSchema.shape.thumbnailKey.optional(),
    mimeType: videoSchema.shape.mimeType.optional().default('video/mp4'),
    status: videoSchema.shape.status.optional().default('draft'),
    difficulty: videoSchema.shape.difficulty.optional(),
    movementType: videoSchema.shape.movementType.optional(),
    tags: videoSchema.shape.tags.optional().default([]),
  });

/** Schema for updating video metadata (partial — media properties are immutable) */
export const updateVideoSchema = videoSchema
  .pick({
    title: true,
    description: true,
    thumbnailKey: true,
    status: true,
    difficulty: true,
    movementType: true,
    bodyParts: true,
    equipment: true,
    tags: true,
  })
  .partial();

/** Response schema for video list API — lightweight fields for catalogue browsing */
export const videoListResponseSchema = videoSchema.pick({
  id: true,
  title: true,
  thumbnailKey: true,
  durationSeconds: true,
  status: true,
  difficulty: true,
  movementType: true,
  bodyParts: true,
  equipment: true,
  tags: true,
});

/** Response schema for video detail API — full record excluding internal storage keys */
export const videoDetailResponseSchema = videoSchema.omit({
  s3Key: true,
  fileSizeBytes: true,
  mimeType: true,
});

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type MovementType = z.infer<typeof movementTypeSchema>;
export type Video = z.infer<typeof videoSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type VideoListResponse = z.infer<typeof videoListResponseSchema>;
export type VideoDetailResponse = z.infer<typeof videoDetailResponseSchema>;
