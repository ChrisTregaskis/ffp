import { uploadUrlRequestSchema, type UploadUrlResponse } from '@ffp/core';
import {
  type APIGatewayProxyEventV2WithJWT,
  createColdStartContext,
  createLogger,
  extractUserContext,
  withErrorHandling,
  ForbiddenError,
  isUserActor,
  setVideoUploadConfig,
  generateUploadUrls,
} from '@ffp/core/server';

// Cold start: initialise S3 upload config from environment variables.
// These are set by SST in sst.config.ts (adminHandlerEnv).
const videosBucketName = process.env.VIDEOS_BUCKET_NAME;
const assetsBucketName = process.env.ASSETS_BUCKET_NAME;
const region = process.env.AWS_REGION ?? 'eu-west-2';

const coldStartContext = createColdStartContext('admin-video-upload-handler');
const coldStartLogger = createLogger(coldStartContext);

if (!videosBucketName || !assetsBucketName) {
  const missing = [
    !videosBucketName && 'VIDEOS_BUCKET_NAME',
    !assetsBucketName && 'ASSETS_BUCKET_NAME',
  ].filter(Boolean);

  coldStartLogger.error(`Video upload disabled — missing env vars: ${missing.join(', ')}`);
} else {
  setVideoUploadConfig({
    videosBucketName,
    assetsBucketName,
    region,
  });
}

/**
 * Lambda handler for POST /admin/videos/upload-url
 *
 * Generates presigned S3 PUT URLs for direct browser-to-S3 video upload.
 * Optionally generates a thumbnail upload URL when thumbnailExtension is provided.
 * Admin role required.
 *
 * Request body (optional):
 * ```json
 * { "thumbnailExtension": "jpg" }
 * ```
 *
 * Response:
 * ```json
 * {
 *   "videoUploadUrl": "https://...",
 *   "videoS3Key": "library/{uuid}.mp4",
 *   "thumbnailUploadUrl": "https://..." | null,
 *   "thumbnailKey": "thumbnails/{uuid}.jpg" | null,
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

    // Parse optional request body for thumbnail extension
    const body = event.body ? (JSON.parse(event.body) as unknown) : {};
    const input = uploadUrlRequestSchema.parse(body);

    return await generateUploadUrls(context, input.thumbnailExtension);
  }
);
