import type { UploadUrlRequest, UploadUrlResponse } from '@ffp/core';
import { uploadUrlResponseSchema } from '@ffp/core';

import { ffpClient, parseApiResponse } from '../client';

const basePath = '/admin/videos';

/**
 * Admin Video API methods
 * These endpoints require system_admin role.
 */
export const adminVideosApi = {
  // Returns presigned PUT URLs for direct browser-to-S3 upload.
  getUploadUrl: async (request?: UploadUrlRequest): Promise<UploadUrlResponse> => {
    const path = `${basePath}/upload-url`;
    const response = await ffpClient.post(path, request ?? {});

    return parseApiResponse(uploadUrlResponseSchema, response, { method: 'POST', path });
  },
};

// Re-export types for consumers
export type { UploadUrlRequest, UploadUrlResponse };
