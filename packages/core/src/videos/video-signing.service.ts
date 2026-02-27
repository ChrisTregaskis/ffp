import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

import { InternalServerError } from '../lib/errors';

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

/**
 * Initialise the video signing configuration.
 * Call once at Lambda cold start — cached at module level for warm invocations.
 *
 * In SST, the handler reads Resource values and passes them here:
 *   setVideoSigningConfig({
 *     cloudfrontDomain: Resource.VideoCdn.url.replace(/^https?:\/\//, ''),
 *     keyPairId: Resource.CloudFrontKeyPairId.value,
 *     privateKey: Resource.CloudFrontSigningKey.value,
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
