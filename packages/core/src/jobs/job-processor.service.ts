import { eq, and, lte, isNull, or, sql, asc, inArray } from 'drizzle-orm';

import { getDb, processJobs, JOB_TYPES, type ProcessJobRecord, type JobType } from '@ffp/database';

import { JobProcessorError } from '../lib/errors';
import { sortBy } from '../lib/sort.utils';

/**
 * Configuration for job processor polling behaviour
 */
export interface JobProcessorConfig {
  /**
   * Maximum concurrent jobs per type.
   * Types not specified will use defaultMaxConcurrent.
   *
   * @example
   * ```typescript
   * maxConcurrentByType: {
   *   score_assessment: 10,
   *   generate_program: 3,
   * }
   * ```
   */
  maxConcurrentByType?: Partial<Record<JobType, number>>;

  /**
   * Default max concurrent for job types not specified in maxConcurrentByType.
   * @default 5
   */
  defaultMaxConcurrent?: number;
}

/**
 * Result of a poll operation containing claimed jobs
 */
export interface PollResult {
  /** Jobs that were successfully claimed for processing */
  claimedJobs: ProcessJobRecord[];
  /** Number of jobs claimed */
  count: number;
}

/**
 * Poll for queued jobs across all types and claim them atomically using FOR UPDATE SKIP LOCKED.
 *
 * This function implements the core job claiming mechanism that prevents
 * double-processing when multiple workers poll concurrently. It polls all
 * job types and respects per-type concurrency limits.
 *
 * @param config - Configuration including per-type and default max concurrent limits
 * @returns PollResult containing the array of claimed jobs and count
 * @throws JobProcessorError if polling or claiming fails
 *
 * @example
 * ```typescript
 * const result = await pollAndClaimJobs({
 *   maxConcurrentByType: {
 *     score_assessment: 10,
 *     generate_program: 3,
 *   },
 *   defaultMaxConcurrent: 5,
 * });
 *
 * console.log(`Claimed ${result.count} jobs`);
 *
 * for (const job of result.claimedJobs) {
 *   // job.type tells you which handler to use
 *   await processJob(job);
 * }
 * ```
 */
export async function pollAndClaimJobs(config: JobProcessorConfig = {}): Promise<PollResult> {
  const { maxConcurrentByType = {}, defaultMaxConcurrent = 5 } = config;

  try {
    const db = getDb();
    const allClaimedJobs: ProcessJobRecord[] = [];

    // Poll each job type with its specific limit
    for (const jobType of JOB_TYPES) {
      const maxConcurrent = maxConcurrentByType[jobType] ?? defaultMaxConcurrent;

      const claimedJobs = await db.transaction(async (tx) => {
        // Find and claim queued jobs atomically
        // - Filter by job type and queued status
        // - Only include jobs where retryAfter is null OR retryAfter <= now
        // - Order by priority (lower number = higher priority)
        // - Limit to maxConcurrent for this type
        // - Lock rows with SKIP LOCKED to avoid blocking other workers
        const queuedJobs = await tx
          .select()
          .from(processJobs)
          .where(
            and(
              eq(processJobs.type, jobType),
              eq(processJobs.status, 'queued'),
              or(isNull(processJobs.retryAfter), lte(processJobs.retryAfter, new Date()))
            )
          )
          .orderBy(asc(processJobs.priority), asc(processJobs.createdAt))
          .limit(maxConcurrent)
          .for('update', { skipLocked: true });

        if (queuedJobs.length === 0) {
          return [];
        }

        // Mark claimed jobs as processing in a single batch update
        const jobIds = queuedJobs.map((j) => j.id);
        const updatedJobs = await tx
          .update(processJobs)
          .set({
            status: 'processing',
            startedAt: new Date(),
            attempts: sql`${processJobs.attempts} + 1`,
          })
          .where(inArray(processJobs.id, jobIds))
          .returning();

        // Sort by priority (ascending) then createdAt to maintain expected order
        return sortBy(updatedJobs, ['priority', 'createdAt']);
      });

      allClaimedJobs.push(...claimedJobs);
    }

    return {
      claimedJobs: allClaimedJobs,
      count: allClaimedJobs.length,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new JobProcessorError('Failed to poll and claim jobs', error);
    }
    throw new JobProcessorError('Failed to poll and claim jobs');
  }
}
