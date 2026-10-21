import type { UploadUrlResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  withErrorHandling,
  withSystemAdmin,
  generateUploadUrls,
} from '@ffp/core/server';

import { missingVideoStorageEnv } from './video-storage-config';

/**
 * Lambda handler for POST /admin/videos/upload-url
 *
 * Generates a presigned S3 PUT URL for direct browser-to-S3 video upload.
 * Admin role required.
 *
 * Response:
 * ```json
 * {
 *   "videoUploadUrl": "https://...",
 *   "videoS3Key": "library/{uuid}.mp4",
 *   "expiresIn": 900
 * }
 * ```
 */
export const handler = withErrorHandling(
  withSystemAdmin(
    'Only system administrators can upload videos',
    async (_event: APIGatewayProxyEventV2WithJWT, context): Promise<UploadUrlResponse> => {
      // A plain Error, so the response stays a generic 500 while the log names the variables
      if (missingVideoStorageEnv.length > 0) {
        throw new Error(
          `Video upload is not configured: missing ${missingVideoStorageEnv.join(', ')}`
        );
      }

      return await generateUploadUrls(context);
    }
  )
);
