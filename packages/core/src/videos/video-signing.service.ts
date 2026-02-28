import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

import { getDb } from '@ffp/database';

import { InternalServerError, NotFoundError } from '../lib/errors';
import { createLogger } from '../lib/logger';

import * as videoRepository from './video.repository';

import type { TenantContext } from '../lib/context';

/** Configuration for CloudFront signed URL generation */
export interface VideoSigningConfig {
  /** CloudFront distribution domain (e.g., 'd1234.cloudfront.net') */
  cloudfrontDomain: string;
  /** CloudFront key pair ID for signed URL verification */
  keyPairId: string;
  /** PEM-encoded RSA private key for URL signing */
  privateKey: string;
}

/** Signed URL time-to-live: 15 minutes */
const SIGNED_URL_TTL_SECONDS = 15 * 60;

/** Module-level cache for Lambda warm instance reuse */
let cachedConfig: VideoSigningConfig | null = null;

/** Response from the signed URL orchestration function */
export interface SignedVideoUrlResponse {
  /** Time-limited CloudFront signed URL for video playback */
  signedUrl: string;
  /** ISO 8601 timestamp when the signed URL expires */
  expiresAt: string;
  /** The video ID that was requested */
  videoId: string;
}

/**
 * Initialise the video signing configuration.
 * Call once at Lambda cold start — cached at module level for warm invocations.
 *
 * The handler reads environment variables (set by SST) and passes them here:
 *   setVideoSigningConfig({
 *     cloudfrontDomain: process.env.CLOUDFRONT_DOMAIN,
 *     keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID,
 *     privateKey: process.env.CLOUDFRONT_SIGNING_KEY,
 *   });
 */
export function setVideoSigningConfig(config: VideoSigningConfig): void {
  cachedConfig = config;
}

function getSigningConfig(): VideoSigningConfig {
  if (!cachedConfig) {
    throw new InternalServerError(
      'Video signing configuration not initialised. Call setVideoSigningConfig() at Lambda cold start.'
    );
  }
  return cachedConfig;
}

/**
 * Generate a time-limited CloudFront signed URL for video playback.
 * Uses canned policy with 15-minute TTL.
 *
 * @param s3Key - The video's S3 object key (e.g., 'exercises/shoulder-stretch.mp4')
 * @returns Signed CloudFront URL with embedded expiry and signature
 */
export function generateSignedVideoUrl(s3Key: string): string {
  const config = getSigningConfig();
  const url = `https://${config.cloudfrontDomain}/${s3Key}`;
  const dateLessThan = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

  return getSignedUrl({
    url,
    keyPairId: config.keyPairId,
    privateKey: config.privateKey,
    dateLessThan,
  });
}

/**
 * Look up a video, verify it is active, and generate a signed playback URL.
 * Logs structured audit events for video access (FFP-299).
 */
export async function getSignedVideoUrl(
  context: TenantContext,
  videoId: string
): Promise<SignedVideoUrlResponse> {
  const logger = createLogger(context);
  const db = getDb();

  const video = await videoRepository.findVideoById(db, videoId);

  if (!video || video.status !== 'active') {
    logger.warn('Video access denied', {
      action: 'video_access_denied',
      videoId,
      reason: !video ? 'not_found' : 'inactive',
    });
    throw new NotFoundError('Video', videoId);
  }

  const signedUrl = generateSignedVideoUrl(video.s3Key);
  const expiresAt = new Date(Date.now() + SIGNED_URL_TTL_SECONDS * 1000).toISOString();

  logger.info('Signed URL generated', {
    action: 'video_access',
    videoId,
    expiresAt,
  });

  return { signedUrl, expiresAt, videoId };
}
