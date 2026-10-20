import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createLogger } from '../src/lib/logger.js';
import { SEED_VIDEO_S3_KEYS } from './seedVideos.js';

const logger = createLogger('seed-video-assets');

/** A five-second silent test pattern: small enough to track, playable everywhere */
const SAMPLE_CLIP_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'assets/sample-exercise.mp4'
);

export interface SeedVideoAssetsOptions {
  /** The stage's videos bucket */
  bucket: string;
  region: string;
}

const objectExists = async (s3: S3Client, bucket: string, key: string): Promise<boolean> => {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    return true;
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;

    if (status === 404) {
      return false;
    }

    throw error;
  }
};

/**
 * Puts the sample clip at every seeded video's `s3_key`, so seeded videos play on a fresh stage.
 *
 * IDEMPOTENT: a key that already has an object is left alone, so real media uploaded over a seed
 * key is never replaced.
 *
 * @returns The number of objects uploaded (0 when every key already exists)
 */
export const seedVideoAssets = async ({
  bucket,
  region,
}: SeedVideoAssetsOptions): Promise<number> => {
  logger.info('Seeding video assets...', { bucket, keys: SEED_VIDEO_S3_KEYS.length });

  const s3 = new S3Client({ region });
  const body = readFileSync(SAMPLE_CLIP_PATH);
  let uploadedCount = 0;

  for (const key of SEED_VIDEO_S3_KEYS) {
    if (await objectExists(s3, bucket, key)) {
      logger.info('Video asset exists, skipping', { key });
      continue;
    }

    await s3.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'video/mp4' })
    );
    uploadedCount++;
    logger.info('Video asset uploaded', { key });
  }

  logger.info('Video assets seeded', {
    uploaded: uploadedCount,
    skipped: SEED_VIDEO_S3_KEYS.length - uploadedCount,
  });

  return uploadedCount;
};
