import { z } from 'zod';

import { videoTagsSchema } from '../tag.schema';

import { videoSchema } from './video-entity.schema';

/** A video's list fields; the admin list extends it */
export const videoListResponseSchema = videoSchema
  .pick({
    id: true,
    publicId: true,
    title: true,
    durationSeconds: true,
    status: true,
    difficulty: true,
    equipment: true,
  })
  .extend({ tags: videoTagsSchema });

/** Response schema for video detail API — full record excluding storage and curation fields */
export const videoDetailResponseSchema = videoSchema
  .omit({
    s3Key: true,
    fileSizeBytes: true,
    mimeType: true,
    isEssential: true,
  })
  .extend({ tags: videoTagsSchema });

/** Response schema for GET /videos/{id}/signed-url — time-limited CloudFront URL */
export const signedVideoUrlResponseSchema = z.object({
  /** Time-limited CloudFront signed URL for video playback */
  signedUrl: z.string().min(1),
  /** ISO 8601 timestamp when the signed URL expires */
  expiresAt: z.string(),
  /** The video ID that was requested */
  videoId: z.guid(),
});

export type VideoDetailResponse = z.infer<typeof videoDetailResponseSchema>;
export type SignedVideoUrlResponse = z.infer<typeof signedVideoUrlResponseSchema>;
