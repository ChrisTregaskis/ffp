import {
  type APIGatewayProxyEventV2WithJWT,
  createColdStartContext,
  createLogger,
  extractUserContext,
  withErrorHandling,
  ValidationError,
  setVideoSigningConfig,
  getSignedVideoUrl,
  type SignedVideoUrlResponse,
} from '@ffp/core/server';

// Cold start: initialise signing config from environment variables.
// These are set by SST in sst.config.ts (videoHandlerEnv).
// The signing key is an SST Secret resolved at deploy time.
const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN?.replace(/^https?:\/\//, '').replace(
  /\/$/,
  ''
);
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
const signingKey = process.env.CLOUDFRONT_SIGNING_KEY;

const coldStartContext = createColdStartContext('video-signed-url-handler');
const coldStartLogger = createLogger(coldStartContext);

if (!cloudfrontDomain || !keyPairId || !signingKey) {
  const missing = [
    !cloudfrontDomain && 'CLOUDFRONT_DOMAIN',
    !keyPairId && 'CLOUDFRONT_KEY_PAIR_ID',
    !signingKey && 'CLOUDFRONT_SIGNING_KEY',
  ].filter(Boolean);

  coldStartLogger.error(`Video signing disabled — missing env vars: ${missing.join(', ')}`);
} else {
  setVideoSigningConfig({
    cloudfrontDomain,
    keyPairId,
    privateKey: signingKey,
  });
}

/**
 * GET /videos/{id}/signed-url
 *
 * Returns a time-limited CloudFront signed URL for video playback.
 * Requires JWT authentication. Logs video access events for audit.
 */
export const handler = withErrorHandling(
  async (event: APIGatewayProxyEventV2WithJWT): Promise<SignedVideoUrlResponse> => {
    const context = extractUserContext(event);

    const videoId = event.pathParameters?.id;

    if (!videoId) {
      throw new ValidationError('Video ID is required in path');
    }

    return await getSignedVideoUrl(context, videoId);
  }
);
