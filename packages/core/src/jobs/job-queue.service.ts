import { getDb, processJobs, type JobType } from '@ffp/database';

import type { OrganisationContext } from '../lib/context';
import type { Transaction } from '../lib/database';
import type { GenerateProgrammePayload, ScoreAssessmentPayload } from '../schemas/job.schema';

/**
 * Maps job types to their corresponding payload types.
 * This enables type-safe payloads when calling queueJob().
 */
export interface JobPayloadMap {
  score_assessment: ScoreAssessmentPayload;
  generate_programme: GenerateProgrammePayload;
}

/**
 * Options for queueing a job
 */
export interface QueueJobOptions {
  /**
   * Job priority: 1=urgent, 2=high, 3=medium, 4=low (default)
   * Lower numbers are processed first.
   */
  priority?: 1 | 2 | 3 | 4;

  /**
   * Maximum number of retry attempts before marking job as failed.
   * @default 3
   */
  maxAttempts?: number;

  /**
   * Optional transaction for atomic operations across multiple writes.
   * If provided, the job is created within this transaction.
   * If not provided, creates the job in a standalone operation.
   */
  tx?: Transaction;
}

/**
 * Queue a job for asynchronous processing
 *
 * Creates a new job record in the database with 'queued' status.
 * The job will be picked up by the job processor on its next poll cycle.
 *
 * @typeParam T - The job type, used to infer the correct payload type
 * @param type - The type of job to queue (e.g., 'score_assessment', 'generate_programme')
 * @param payload - Job-specific data required for processing (type-safe based on job type)
 * @param context - Organisation context for RLS isolation
 * @param options - Optional configuration for priority, retry behaviour, and transaction
 * @returns The UUID of the created job for tracking
 *
 */
export async function queueJob<T extends JobType>(
  type: T,
  payload: JobPayloadMap[T],
  context: OrganisationContext,
  options: QueueJobOptions = {}
): Promise<string> {
  const { priority = 4, maxAttempts = 3, tx } = options;

  // Use provided transaction or get standalone db connection
  const dbClient = tx ?? getDb();

  const [job] = await dbClient
    .insert(processJobs)
    .values({
      organisationId: context.organisationId,
      type,
      payload,
      priority,
      maxAttempts,
      // status defaults to 'queued' in schema
      // attempts defaults to 0 in schema
    })
    .returning({ id: processJobs.id });

  return job.id;
}
