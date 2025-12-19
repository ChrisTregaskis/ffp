import { eq, and, lte, isNull, or, sql, asc, inArray } from 'drizzle-orm';

import { getDb, processJobs, JOB_TYPES, type ProcessJobRecord, type JobType } from '@ffp/database';

import { JobProcessorError, NotFoundError } from '../lib/errors';
import { sortBy } from '../lib/sort.utils';

/**
 * Calculate exponential backoff delay in milliseconds.
 *
 * Uses formula: 2^attempts * 1000ms
 *
 * @param attempts - Current attempt number (1-based after first failure)
 * @returns Delay in milliseconds before next retry
 *
 * @example
 * ```typescript
 * calculateBackoffMs(1); // 2000ms (2 seconds)
 * calculateBackoffMs(2); // 4000ms (4 seconds)
 * calculateBackoffMs(3); // 8000ms (8 seconds)
 * ```
 */
export function calculateBackoffMs(attempts: number): number {
  return Math.pow(2, attempts) * 1000;
}

/**
 * Result of a job completion operation
 */
export interface CompleteJobResult {
  /** The job ID that was completed */
  jobId: string;
  /** Whether the operation succeeded */
  success: boolean;
}

/**
 * Mark a job as successfully completed with its result.
 *
 * Sets status to 'completed', stores the result, and records completion time.
 *
 * @typeParam TResult - The shape of the job result (inferred or explicit)
 * @returns CompleteJobResult indicating success
 *
 * @example
 * ```typescript
 * // Type inferred from argument
 * await completeJob(job.id, {
 *   scores: { strength: 75, balance: 82 },
 *   recommendations: ['core_stability', 'balance_training'],
 * });
 *
 * // Explicit type for stricter checking
 * interface ScoreResult {
 *   scores: Record<string, number>;
 *   recommendations: string[];
 * }
 * await completeJob<ScoreResult>(job.id, result);
 * ```
 */
export async function completeJob<TResult extends Record<string, unknown>>(
  jobId: string,
  result: TResult
): Promise<CompleteJobResult> {
  try {
    const db = getDb();

    // Only complete jobs that are currently processing
    const updatedRows = await db
      .update(processJobs)
      .set({
        status: 'completed',
        result,
        completedAt: new Date(),
      })
      .where(and(eq(processJobs.id, jobId), eq(processJobs.status, 'processing')))
      .returning();

    if (updatedRows.length === 0) {
      throw new NotFoundError('Process job', jobId);
    }

    return { jobId, success: true };
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new JobProcessorError(`Failed to complete job ${jobId}`, error);
    }
    throw new JobProcessorError(`Failed to complete job ${jobId}`);
  }
}

/**
 * Result of a job failure operation
 */
export interface FailJobResult {
  /** The job ID that failed */
  jobId: string;
  /** Whether the job will be retried */
  willRetry: boolean;
  /** The next retry time (if retrying) */
  retryAfter: Date | null;
  /** The final status after handling the failure */
  newStatus: 'queued' | 'failed';
}

/**
 * Handle a job failure with exponential backoff retry logic.
 *
 * @example
 * ```typescript
 * const result = await failJob(job, new Error('API timeout'));
 *
 * if (result.willRetry) {
 *   console.log(`Job will retry after ${result.retryAfter}`);
 * } else {
 *   console.log('Job permanently failed');
 * }
 * ```
 */
export async function failJob(job: ProcessJobRecord, error: Error): Promise<FailJobResult> {
  try {
    const db = getDb();

    const shouldRetry = job.attempts < job.maxAttempts;
    const backoffMs = calculateBackoffMs(job.attempts);
    const retryAfter = shouldRetry ? new Date(Date.now() + backoffMs) : null;

    // Only fail jobs that are currently processing
    // Retry: return to queue with backoff delay
    // Final failure: mark as failed with completion timestamp
    const updatedRows = await db
      .update(processJobs)
      .set({
        status: shouldRetry ? 'queued' : 'failed',
        message: error.message,
        retryAfter,
        completedAt: shouldRetry ? null : new Date(),
      })
      .where(and(eq(processJobs.id, job.id), eq(processJobs.status, 'processing')))
      .returning();

    if (updatedRows.length === 0) {
      throw new NotFoundError('Process job', job.id);
    }

    return {
      jobId: job.id,
      willRetry: shouldRetry,
      retryAfter,
      newStatus: shouldRetry ? 'queued' : 'failed',
    };
  } catch (updateError: unknown) {
    if (updateError instanceof NotFoundError) {
      throw updateError;
    }

    if (updateError instanceof Error) {
      throw new JobProcessorError(`Failed to handle job failure for ${job.id}`, updateError);
    }

    throw new JobProcessorError(`Failed to handle job failure for ${job.id}`);
  }
}

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
