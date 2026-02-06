import {
  scoreAssessmentPayloadSchema,
  generateProgrammePayloadSchema,
  scoreAssessmentResultSchema,
  generateProgrammeResultSchema,
  type ScoreAssessmentResult,
  type GenerateProgrammePayload,
  type GenerateProgrammeResult,
} from '@ffp/core';
import {
  pollAndClaimJobs,
  completeJob,
  failJob,
  extractJobContext,
  processScoreAssessment,
  createLogger,
  createSystemLogger,
  ValidationError,
  processGenerateProgramme,
  type JobProcessorConfig,
} from '@ffp/core/server';
import { getDb, type ProcessJobRecord, type JobType } from '@ffp/database';

import type { Context, ScheduledEvent } from 'aws-lambda';

// ============================================================================
// Job Type Mappings
// ============================================================================
//
// Payload and result types are imported from @ffp/core (Zod-inferred canonical types).
// These mappings enable type-safe routing in processJobByType.

/** Map job type to its result type */
export interface JobResultMap {
  score_assessment: ScoreAssessmentResult;
  generate_programme: GenerateProgrammeResult;
}

/** Union of all job results (for storage in database) */
export type JobResult = JobResultMap[JobType];

/**
 * Job processor Lambda handler
 *
 * Triggered by EventBridge Cron rule every minute to poll and process queued jobs.
 *
 * **Execution Model:**
 * - Polls all job types with per-type concurrency limits
 * - Claims jobs atomically and processes them within this invocation
 * - Job handlers are placeholder stubs until scoring/programme services are built
 *
 * **RLS Strategy:**
 * - Processor runs with standard DB connection (not tenant-scoped)
 * - Each job handler will set tenant context for tenant-scoped operations
 *
 * @param event - EventBridge scheduled event (unused but required by Lambda signature)
 * @param context - Lambda execution context for timeout tracking
 */
export const handler = async (event: ScheduledEvent, context: Context): Promise<void> => {
  const sysLogger = createSystemLogger('job-processor', undefined, context.awsRequestId);

  sysLogger.info('Processor triggered', {
    time: event.time,
    source: event.source,
  });

  // Warm-up database connection for Lambda cold start optimisation.
  // pollAndClaimJobs() calls getDb() internally, but pre-warming here
  // ensures connection is established before job processing begins.
  getDb();

  // Configuration for job processing
  const config: JobProcessorConfig = {
    maxConcurrentByType: {
      score_assessment: 5,
      generate_programme: 3,
    },
    defaultMaxConcurrent: 5,
  };

  try {
    // Poll and claim available jobs across all types
    const { claimedJobs, count } = await pollAndClaimJobs(config);

    if (count === 0) {
      sysLogger.info('No jobs to process');
      return;
    }

    sysLogger.info('Claimed jobs for processing', { count });

    // Process each claimed job sequentially for easier debugging and tracing
    let completed = 0;
    let failed = 0;

    for (const job of claimedJobs) {
      // Create tenant-aware context for structured logging
      const jobContext = extractJobContext({
        tenantId: job.tenantId,
        jobId: job.id,
        jobType: job.type,
      });

      const logger = createLogger(jobContext);

      logger.info('Processing job', {
        priority: job.priority,
        attempt: job.attempts,
        remainingTimeMs: context.getRemainingTimeInMillis(),
      });

      try {
        // Route to appropriate handler based on job type
        const result = await processJobByType(job);

        // Mark job as completed with result
        await completeJob(job.id, result);

        logger.info('Job completed successfully');
        completed++;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        logger.error('Job failed', { error: err.message });

        // Handle failure with retry logic
        const failResult = await failJob(job, err);

        logger.warn('Job failure handled', {
          willRetry: failResult.willRetry,
          newStatus: failResult.newStatus,
          retryAfter: failResult.retryAfter?.toISOString(),
        });

        failed++;
      }
    }

    sysLogger.info('Job processing complete', {
      total: count,
      completed,
      failed,
    });
  } catch (error) {
    sysLogger.error('Job processor failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Route job to appropriate handler based on type
 *
 * Generic function that returns the correct result type based on job type.
 * TypeScript narrows the return type based on the job.type discriminant.
 *
 * @param job - The job record to process
 * @returns Promise resolving to typed result object to store in job.result
 */
export async function processJobByType<T extends JobType>(
  job: ProcessJobRecord & { type: T }
): Promise<JobResultMap[T]> {
  switch (job.type) {
    case 'score_assessment': {
      const parseResult = scoreAssessmentPayloadSchema.safeParse(job.payload);

      if (!parseResult.success) {
        throw new ValidationError('Invalid score_assessment payload', {
          jobId: job.id,
          errors: parseResult.error.format(),
        });
      }

      const result = await handleScoreAssessment(parseResult.data, job.tenantId);

      // Validate result matches schema (runtime safety check)
      const resultValidation = scoreAssessmentResultSchema.safeParse(result);
      if (!resultValidation.success) {
        throw new ValidationError('Invalid score_assessment result from handler', {
          jobId: job.id,
          errors: resultValidation.error.format(),
        });
      }

      // Type assertion is safe: result validated against ScoreAssessmentResult schema
      return resultValidation.data as JobResultMap[T];
    }

    case 'generate_programme': {
      const parseResult = generateProgrammePayloadSchema.safeParse(job.payload);

      if (!parseResult.success) {
        throw new ValidationError('Invalid generate_programme payload', {
          jobId: job.id,
          errors: parseResult.error.format(),
        });
      }

      const result = await handleGenerateProgramme(parseResult.data, job.tenantId);

      // Validate result matches schema (runtime safety check)
      const resultValidation = generateProgrammeResultSchema.safeParse(result);
      if (!resultValidation.success) {
        throw new ValidationError('Invalid generate_programme result from handler', {
          jobId: job.id,
          errors: resultValidation.error.format(),
        });
      }

      // Type assertion is safe: result validated against GenerateProgrammeResult schema
      return resultValidation.data as JobResultMap[T];
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = job.type;
      throw new Error(`Unknown job type: ${String(_exhaustive)}`);
    }
  }
}

/** Delegate to core scoring handler */
async function handleScoreAssessment(
  payload: { userAssessmentId: string; flowId: string; userId: string },
  tenantId: string
): Promise<ScoreAssessmentResult> {
  return await processScoreAssessment(payload, tenantId);
}

/** Delegate to core programme generation handler */
async function handleGenerateProgramme(
  payload: GenerateProgrammePayload,
  tenantId: string
): Promise<GenerateProgrammeResult> {
  return await processGenerateProgramme(payload, tenantId);
}
