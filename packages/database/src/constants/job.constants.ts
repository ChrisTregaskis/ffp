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
 * - generate_programme: Generate personalised workout programme from scores
 */
export const JOB_TYPES = ['score_assessment', 'generate_programme'] as const;

export type JobType = (typeof JOB_TYPES)[number];
