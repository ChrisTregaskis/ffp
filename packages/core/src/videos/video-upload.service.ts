import { randomUUID } from 'crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { InternalServerError } from '../lib/errors';
import { createLogger } from '../lib/logger';

import type { OrganisationContext } from '../lib/context';
import type { UploadUrlResponse } from '../schemas/video/video.schema';

/** Configuration for S3 presigned upload URL generation */
export interface VideoUploadConfig {
  /** S3 bucket name for video files (VideosBucket) */
  videosBucketName: string;
  /** S3 bucket name for asset files like thumbnails (AssetsBucket) */
  assetsBucketName: string;
  /** AWS region (e.g., 'eu-west-2') */
  region: string;
}

/** Presigned upload URL time-to-live: 15 minutes */
const UPLOAD_URL_TTL_SECONDS = 15 * 60;

/** Module-level cache for Lambda warm instance reuse */
let cachedConfig: VideoUploadConfig | null = null;
let s3Client: S3Client | null = null;

/**
 * Initialise the video upload configuration.
 * Call once at Lambda cold start — cached at module level for warm invocations.
 *
 * The handler reads environment variables (set by SST) and passes them here:
 *   setVideoUploadConfig({
 *     videosBucketName: process.env.VIDEOS_BUCKET_NAME,
 *     assetsBucketName: process.env.ASSETS_BUCKET_NAME,
 *     region: 'eu-west-2',
 *   });
 */
export function setVideoUploadConfig(config: VideoUploadConfig): void {
  cachedConfig = config;
  s3Client = new S3Client({ region: config.region });
}

function getUploadConfig(): { config: VideoUploadConfig; client: S3Client } {
  if (!cachedConfig || !s3Client) {
    throw new InternalServerError(
      'Video upload configuration not initialised. Call setVideoUploadConfig() at Lambda cold start.'
    );
  }

  return { config: cachedConfig, client: s3Client };
}

/**
 * Generate a presigned S3 PUT URL for video upload.
 *
 * Video key format: `library/{uuid}.mp4`
 *
 * URL expires after 15 minutes. The browser uses it to PUT the file
 * directly to S3 without passing through the API.
 *
 * @param context - Organisation context for structured logging
 * @returns Presigned upload URL and S3 key
 */
export async function generateUploadUrls(context: OrganisationContext): Promise<UploadUrlResponse> {
  const logger = createLogger(context);
  const { config, client } = getUploadConfig();

  const videoId = randomUUID();
  const videoS3Key = `library/${videoId}.mp4`;

  const videoCommand = new PutObjectCommand({
    Bucket: config.videosBucketName,
    Key: videoS3Key,
    ContentType: 'video/mp4',
  });

  const videoUploadUrl = await getSignedUrl(client, videoCommand, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });

  logger.info('Upload URLs generated', {
    action: 'upload_urls_generated',
    videoS3Key,
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });

  return {
    videoUploadUrl,
    videoS3Key,
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  };
}
