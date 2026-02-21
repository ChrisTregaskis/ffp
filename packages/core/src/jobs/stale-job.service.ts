import { eq, and, lte, sql } from 'drizzle-orm';

import { getDb, processJobs, JOB_TYPES, type JobType } from '@ffp/database';

import { createSystemLogger } from '../lib/logger';

const logger = createSystemLogger('stale-job-detector');

/** Default threshold in seconds before a processing job is considered stale */
const DEFAULT_STALE_THRESHOLD_SECONDS = 300;

export interface StaleJobConfig {
  /** Default threshold for job types without a specific override (default: 300s) */
  defaultThresholdSeconds?: number;

  /**
   * Per-type threshold overrides in seconds.
   * Types not specified will use `defaultThresholdSeconds`.
   *
   * @example
   * ```typescript
   * thresholdByType: {
   *   score_assessment: 300,       // 5 minutes
   *   generate_programme: 900,     // 15 minutes (slower job)
   * }
   * ```
   */
  thresholdByType?: Partial<Record<JobType, number>>;
}

export interface DetectStaleJobsResult {
  /** Total number of stale jobs found and marked as failed */
  markedFailed: number;
}

/**
 * Detect and mark stale jobs as failed, with per-type threshold support.
 *
 * Iterates over all job types, applying the configured threshold for each.
 * Jobs stuck in 'processing' status where `started_at` exceeds the threshold
 * are updated to 'failed' with a descriptive message.
 */
export async function detectAndMarkStaleJobs(
  config: StaleJobConfig = {}
): Promise<DetectStaleJobsResult> {
  const { defaultThresholdSeconds = DEFAULT_STALE_THRESHOLD_SECONDS, thresholdByType = {} } =
    config;

  const db = getDb();
  let totalMarkedFailed = 0;

  for (const jobType of JOB_TYPES) {
    const thresholdSeconds = thresholdByType[jobType] ?? defaultThresholdSeconds;
    const thresholdStr = String(thresholdSeconds);
    const cutoff = sql`NOW() - INTERVAL '${sql.raw(thresholdStr)} seconds'`;

    const updatedRows = await db
      .update(processJobs)
      .set({
        status: 'failed',
        message: sql<string>`'Job timed out - started at ' || ${processJobs.startedAt}::text || ', exceeded ' || ${sql.raw(`'${thresholdStr}'`)} || 's threshold'`,
        completedAt: new Date(),
      })
      .where(
        and(
          eq(processJobs.type, jobType),
          eq(processJobs.status, 'processing'),
          lte(processJobs.startedAt, cutoff)
        )
      )
      .returning({ id: processJobs.id, type: processJobs.type, startedAt: processJobs.startedAt });

    if (updatedRows.length > 0) {
      for (const row of updatedRows) {
        logger.warn('Stale job marked as failed', {
          jobId: row.id,
          jobType: row.type,
          startedAt: row.startedAt?.toISOString(),
          thresholdSeconds,
        });
      }

      totalMarkedFailed += updatedRows.length;
    }
  }

  return { markedFailed: totalMarkedFailed };
}
