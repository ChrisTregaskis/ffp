import { setVideoUploadConfig } from '@ffp/core/server';

// Cold start: initialise the S3 config from environment variables (adminHandlerEnv in
// sst.config.ts). The admin router imports this module into every admin Lambda, including
// the CORS preflight one that has no bucket variables, so a missing variable is only
// reported when a handler actually needs the buckets.
const videosBucketName = process.env.VIDEOS_BUCKET_NAME;
const assetsBucketName = process.env.ASSETS_BUCKET_NAME;
const region = process.env.AWS_REGION ?? 'eu-west-2';

export const missingVideoStorageEnv = [
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
