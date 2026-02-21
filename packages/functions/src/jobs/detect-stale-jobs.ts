import { detectAndMarkStaleJobs, createSystemLogger } from '@ffp/core/server';
import { getDb, JOB_TYPES, type JobType } from '@ffp/database';

import type { Context, ScheduledEvent } from 'aws-lambda';

/** Default threshold: 5 minutes (300 seconds) */
const DEFAULT_THRESHOLD_SECONDS = 300;

/**
 * Convention: STALE_JOB_THRESHOLD_{JOB_TYPE_UPPERCASE}
 * e.g. STALE_JOB_THRESHOLD_GENERATE_PROGRAMME=900
 */
const THRESHOLD_ENV_PREFIX = 'STALE_JOB_THRESHOLD_';

/**
 * Stale job detection Lambda handler
 *
 * Triggered by EventBridge Cron rule every 5 minutes to detect and mark
 * stale jobs as failed. A job is considered stale when it has been in
 * 'processing' status longer than the configured threshold.
 */
export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  const logger = createSystemLogger('stale-job-detector', undefined, context.awsRequestId);

  logger.info('Stale job detection triggered', {
    time: event.time,
    source: event.source,
  });

  // Warm-up database connection for Lambda cold start optimisation
  getDb();

  const defaultThresholdSeconds = parseThreshold(process.env.STALE_JOB_THRESHOLD_SECONDS);
  const thresholdByType = buildThresholdByType();

  try {
    const result = await detectAndMarkStaleJobs({
      defaultThresholdSeconds,
      thresholdByType,
    });

    logger.info('Stale job detection complete', {
      markedFailed: result.markedFailed,
      defaultThresholdSeconds,
      thresholdByType,
    });
  } catch (error) {
    logger.error('Stale job detection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Build per-type threshold overrides from environment variables.
 *
 * Scans for env vars matching the pattern STALE_JOB_THRESHOLD_{JOB_TYPE_UPPERCASE}
 * for each known job type. Only includes types with valid positive integer values.
 */
function buildThresholdByType(): Partial<Record<JobType, number>> {
  const overrides: Partial<Record<JobType, number>> = {};

  for (const jobType of JOB_TYPES) {
    const envKey = `${THRESHOLD_ENV_PREFIX}${jobType.toUpperCase()}`;
    const value = process.env[envKey];

    if (value !== undefined) {
      overrides[jobType] = parseThreshold(value);
    }
  }

  return overrides;
}

/**
 * Parse threshold from environment variable string.
 * Returns default if value is missing, empty, or not a valid positive integer.
 */
function parseThreshold(value: string | undefined): number {
  if (!value) {
    return DEFAULT_THRESHOLD_SECONDS;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_THRESHOLD_SECONDS;
  }

  return parsed;
}
