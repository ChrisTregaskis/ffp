import { z } from 'zod';

import { createPaginatedResponseSchema } from '../pagination.schema';

import { videoListResponseSchema } from './video-catalogue.schema';
import { difficultySchema, videoStatusSchema } from './video-entity.schema';

/** Allowed thumbnail file extensions for upload */
const THUMBNAIL_EXTENSIONS = ['jpg', 'jpeg', 'png'] as const;

/** Request schema for generating presigned upload URLs */
export const uploadUrlRequestSchema = z.object({
  /** Optional thumbnail file extension — when provided, a thumbnail upload URL is also generated */
  thumbnailExtension: z.enum(THUMBNAIL_EXTENSIONS).optional(),
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

export type AdminVideoFilterInput = z.infer<typeof adminVideoFilterSchema>;
export type AdminVideoListResponse = z.infer<typeof adminVideoListResponseSchema>;
export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
