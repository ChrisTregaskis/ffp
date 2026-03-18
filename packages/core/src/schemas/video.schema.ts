import { z } from 'zod';

import { VIDEO_STATUSES, DIFFICULTIES, MOVEMENT_TYPES } from '@ffp/database/constants';

import { createPaginatedResponseSchema } from './pagination.schema';

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
    thumbnailKey: videoSchema.shape.thumbnailKey.optional(),
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
    thumbnailKey: true,
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

/** Allowed thumbnail file extensions for upload */
const THUMBNAIL_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const;

/** Request schema for generating presigned upload URLs */
export const uploadUrlRequestSchema = z.object({
  /** Optional thumbnail file extension — when provided, a thumbnail upload URL is also generated */
  thumbnailExtension: z.enum(THUMBNAIL_EXTENSIONS).optional(),
});

/** Filter criteria for video catalogue queries — all fields optional, combine with AND logic */
export const videoFilterSchema = z.object({
  bodyParts: z.array(z.string().min(1)).optional(),
  equipment: z.array(z.string().min(1)).optional(),
  difficulty: difficultySchema.optional(),
  movementType: movementTypeSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
});

/** Filter criteria for admin video list — includes search and status (all statuses visible) */
export const adminVideoFilterSchema = z.object({
  search: z.string().optional(),
  status: videoStatusSchema.optional(),
  difficulty: difficultySchema.optional(),
});

/** Response schema for presigned upload URL endpoint */
export const uploadUrlResponseSchema = z.object({
  /** Presigned PUT URL for uploading the video file to S3 */
  videoUploadUrl: z.url(),
  /** S3 object key for the video (e.g., 'library/{uuid}.mp4') */
  videoS3Key: z.string().min(1),
  /** Presigned PUT URL for uploading the thumbnail (null if not requested) */
  thumbnailUploadUrl: z.url().nullable(),
  /** S3 object key for the thumbnail (null if not requested) */
  thumbnailKey: z.string().min(1).nullable(),
  /** URL validity period in seconds */
  expiresIn: z.number().int().positive(),
});

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

/** Response schema for admin video list — includes description and timestamps for admin context */
export const adminVideoListResponseSchema = videoListResponseSchema.extend({
  description: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Paginated response schema for GET /admin/videos */
export const paginatedAdminVideoResponseSchema = createPaginatedResponseSchema(
  adminVideoListResponseSchema
);

/** Response schema for GET /videos — list wrapper with count */
export const videoListApiResponseSchema = z.object({
  videos: z.array(videoListResponseSchema),
  count: z.number().int().nonnegative(),
});

/** Response schema for GET /videos/{id}/signed-url — time-limited CloudFront URL */
export const signedVideoUrlResponseSchema = z.object({
  /** Time-limited CloudFront signed URL for video playback */
  signedUrl: z.string().min(1),
  /** ISO 8601 timestamp when the signed URL expires */
  expiresAt: z.string(),
  /** The video ID that was requested */
  videoId: z.guid(),
});

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type MovementType = z.infer<typeof movementTypeSchema>;
export type Video = z.infer<typeof videoSchema>;
export type CreateVideoInput = z.infer<typeof createVideoSchema>;
export type UpdateVideoInput = z.infer<typeof updateVideoSchema>;
export type VideoFilterInput = z.infer<typeof videoFilterSchema>;
export type AdminVideoFilterInput = z.infer<typeof adminVideoFilterSchema>;
export type AdminVideoListResponse = z.infer<typeof adminVideoListResponseSchema>;
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
export type VideoListResponse = z.infer<typeof videoListResponseSchema>;
export type VideoDetailResponse = z.infer<typeof videoDetailResponseSchema>;
export type VideoListApiResponse = z.infer<typeof videoListApiResponseSchema>;
export type SignedVideoUrlResponse = z.infer<typeof signedVideoUrlResponseSchema>;
