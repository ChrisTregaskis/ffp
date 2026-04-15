import { z } from 'zod';

import { difficultySchema, movementTypeSchema, videoSchema } from './video-entity.schema';

/** Filter criteria for video catalogue queries — all fields optional, combine with AND logic */
export const videoFilterSchema = z.object({
  bodyParts: z.array(z.string().min(1)).optional(),
  equipment: z.array(z.string().min(1)).optional(),
  difficulty: difficultySchema.optional(),
  movementType: movementTypeSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
});

/** Response schema for video list API — lightweight fields for catalogue browsing */
export const videoListResponseSchema = videoSchema.pick({
  id: true,
  publicId: true,
  title: true,
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

export type VideoFilterInput = z.infer<typeof videoFilterSchema>;
export type VideoListResponse = z.infer<typeof videoListResponseSchema>;
export type VideoDetailResponse = z.infer<typeof videoDetailResponseSchema>;
export type VideoListApiResponse = z.infer<typeof videoListApiResponseSchema>;
export type SignedVideoUrlResponse = z.infer<typeof signedVideoUrlResponseSchema>;
