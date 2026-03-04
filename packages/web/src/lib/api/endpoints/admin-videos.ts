import { z } from 'zod';

import type { CreateVideoInput, UploadUrlRequest, UploadUrlResponse } from '@ffp/core';
import { uploadUrlResponseSchema, videoSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/videos';

/** Response schema for the create video endpoint */
const createVideoResponseSchema = z.object({
  video: videoSchema,
});

/**
 * Admin Video API methods
 * These endpoints require system_admin role.
 */
export const adminVideosApi = {
  /** Returns presigned PUT URLs for direct browser-to-S3 upload. */
  getUploadUrl: async (request?: UploadUrlRequest): Promise<UploadUrlResponse> => {
    const path = `${basePath}/upload-url`;
    const response = await ffpClient.post(path, request ?? {});

    return parseApiResponse(uploadUrlResponseSchema, response, { method: 'POST', path });
  },

  /** Creates a video record with metadata after successful S3 upload. */
  createVideo: async (input: CreateVideoInput): Promise<{ video: z.infer<typeof videoSchema> }> => {
    const path = basePath;
    const response = await ffpClient.post(path, input);

    return parseApiResponse(createVideoResponseSchema, response, { method: 'POST', path });
  },
};

// Re-export types for consumers
export type { CreateVideoInput, UploadUrlRequest, UploadUrlResponse };
