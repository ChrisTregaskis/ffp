import { z } from 'zod';

import { createPaginatedResponseSchema } from '../pagination.schema';
import { publicIdSchema } from '../public-id.schema';

import { videoDetailResponseSchema, videoListResponseSchema } from './video-catalogue.schema';
import { difficultySchema, videoStatusSchema } from './video-entity.schema';

/** Filter criteria for admin video list — includes search and status (all statuses visible) */
export const adminVideoFilterSchema = z.object({
  search: z.string().optional(),
  status: videoStatusSchema.optional(),
  difficulty: difficultySchema.optional(),
  /** Tag publicIds; a video matches when it carries one of them in each category they span */
  tags: z.array(publicIdSchema).optional(),
});

/** Response schema for presigned upload URL endpoint */
export const uploadUrlResponseSchema = z.object({
  /** Presigned PUT URL for uploading the video file to S3 */
  videoUploadUrl: z.url(),
  /** S3 object key for the video (e.g., 'library/{uuid}.mp4') */
  videoS3Key: z.string().min(1),
  /** URL validity period in seconds */
  expiresIn: z.number().int().positive(),
});

/** Response schema for admin video list — includes description and timestamps for admin context */
export const adminVideoListResponseSchema = videoListResponseSchema.extend({
  description: z.string().nullable(),
  isEssential: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Admin read of one video: everything but its storage details */
export const adminVideoDetailSchema = videoDetailResponseSchema.extend({
  isEssential: z.boolean(),
});

export const adminVideoResponseSchema = z.object({
  video: adminVideoDetailSchema,
});

/** Paginated response schema for GET /admin/videos */
export const paginatedAdminVideoResponseSchema = createPaginatedResponseSchema(
  adminVideoListResponseSchema
);

export type AdminVideoFilterInput = z.infer<typeof adminVideoFilterSchema>;
export type AdminVideoListResponse = z.infer<typeof adminVideoListResponseSchema>;
export type AdminVideoDetail = z.infer<typeof adminVideoDetailSchema>;
export type AdminVideoResponse = z.infer<typeof adminVideoResponseSchema>;
export type UploadUrlResponse = z.infer<typeof uploadUrlResponseSchema>;
