/**
 * Job constants - Single source of truth for job-related enums
 *
 * These constants are shared between:
 * - @ffp/database: PostgreSQL enum definitions (pgEnum)
 * - @ffp/core: Zod validation schemas (z.enum)
 *
 * IMPORTANT: When adding new job statuses or types:
 * 1. Update this file
 * 2. Run `pnpm db:generate` to create migration for enum changes
 * 3. Run `pnpm db:migrate` to apply changes
 * 4. Both database and Zod schemas will automatically use updated values
 */

/**
 * Job status values
 *
 * Lifecycle: queued → processing → completed/failed/cancelled
 * - queued: Job created, waiting to be picked up by worker
 * - processing: Worker has claimed the job, currently executing
 * - completed: Job finished successfully, result populated
 * - failed: Job failed after max retries, message populated
 * - cancelled: Job was manually cancelled before completion
 */
export const JOB_STATUSES = ['queued', 'processing', 'completed', 'failed', 'cancelled'] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

/**
 * Job type values
 *
 * MVP job types:
 * - score_assessment: Calculate dimensional scores from assessment responses
 * - generate_program: Generate personalised workout programme from scores
 */
export const JOB_TYPES = ['score_assessment', 'generate_program'] as const;

export type JobType = (typeof JOB_TYPES)[number];
