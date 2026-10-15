import type { UploadUrlResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  setVideoUploadConfig,
  generateUploadUrls,
} from '@ffp/core/server';

// Cold start: initialise S3 upload config from environment variables (adminHandlerEnv in
// sst.config.ts). The admin router imports this module into every admin Lambda, including
// the CORS preflight one that has no bucket variables, so a missing variable is only
// reported when an upload is actually requested.
const videosBucketName = process.env.VIDEOS_BUCKET_NAME;
const assetsBucketName = process.env.ASSETS_BUCKET_NAME;
const region = process.env.AWS_REGION ?? 'eu-west-2';

const missingEnv = [
  !videosBucketName && 'VIDEOS_BUCKET_NAME',
  !assetsBucketName && 'ASSETS_BUCKET_NAME',
].filter(Boolean);

if (videosBucketName && assetsBucketName) {
  setVideoUploadConfig({
    videosBucketName,
    assetsBucketName,
    region,
  });
}

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
  async (event: APIGatewayProxyEventV2WithJWT): Promise<UploadUrlResponse> => {
    const context = extractUserContext(event);

    if (!isUserActor(context.actor) || context.actor.userRole !== 'system_admin') {
      throw new ForbiddenError('Only system administrators can upload videos');
    }

    // A plain Error, so the response stays a generic 500 while the log names the variables
    if (missingEnv.length > 0) {
      throw new Error(`Video upload is not configured: missing ${missingEnv.join(', ')}`);
    }

    return await generateUploadUrls(context);
  }
);
