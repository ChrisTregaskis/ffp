import {
  scoreAssessmentPayloadSchema,
  generateProgramPayloadSchema,
  type ScoreAssessmentPayload,
  type GenerateProgramPayload,
  type ScoreAssessmentResult,
  type GenerateProgramResult,
} from '@ffp/core';
import {
  pollAndClaimJobs,
  completeJob,
  failJob,
  extractJobContext,
  Logger,
  SystemLogger,
  ValidationError,
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
interface JobResultMap {
  score_assessment: ScoreAssessmentResult;
  generate_program: GenerateProgramResult;
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
  const sysLogger = new SystemLogger('job-processor', undefined, context.awsRequestId);

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
      generate_program: 3,
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

      const logger = new Logger(jobContext);

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
async function processJobByType<T extends JobType>(
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

      return (await handleScoreAssessment(parseResult.data)) as JobResultMap[T];
    }

    case 'generate_program': {
      const parseResult = generateProgramPayloadSchema.safeParse(job.payload);

      if (!parseResult.success) {
        throw new ValidationError('Invalid generate_program payload', {
          jobId: job.id,
          errors: parseResult.error.format(),
        });
      }

      return (await handleGenerateProgram(parseResult.data)) as JobResultMap[T];
    }

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = job.type;
      throw new Error(`Unknown job type: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Handle score_assessment job
 *
 * Placeholder until FFP-133 (Scoring Service) is implemented.
 * Will calculate dimensional scores from assessment responses.
 *
 * @param _payload - Assessment scoring payload (validated via Zod schema)
 * @returns Promise resolving to scoring result
 */
async function handleScoreAssessment(
  _payload: ScoreAssessmentPayload
): Promise<ScoreAssessmentResult> {
  // TODO: FFP-133 - Implement actual scoring logic
  // Logging will be added when service is implemented with proper context

  // Placeholder: Return mock result structure matching canonical schema
  // await used to satisfy linter - will be replaced with actual async operations
  return await Promise.resolve({
    scores: [
      {
        dimensionId: 'placeholder-strength',
        dimensionName: 'Strength',
        rawScore: 0,
        normalisedScore: 0,
        category: 'pending',
      },
      {
        dimensionId: 'placeholder-balance',
        dimensionName: 'Balance',
        rawScore: 0,
        normalisedScore: 0,
        category: 'pending',
      },
      {
        dimensionId: 'placeholder-flexibility',
        dimensionName: 'Flexibility',
        rawScore: 0,
        normalisedScore: 0,
        category: 'pending',
      },
    ],
    scoredAt: new Date().toISOString(),
  });
}

/**
 * Handle generate_program job
 *
 * Placeholder until FFP-134 (Programme Generation Service) is implemented.
 * Will generate personalised workout programme from assessment scores.
 *
 * @param _payload - Programme generation payload (validated via Zod schema)
 * @returns Promise resolving to generated programme result
 */
async function handleGenerateProgram(
  _payload: GenerateProgramPayload
): Promise<GenerateProgramResult> {
  // TODO: FFP-134 - Implement actual programme generation logic
  // Logging will be added when service is implemented with proper context

  // Placeholder: Return mock result structure matching canonical schema
  // await used to satisfy linter - will be replaced with actual async operations
  return await Promise.resolve({
    programId: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
    programName: 'Pending Programme',
    durationWeeks: 0,
    exercises: [],
    sessionsPerWeek: 0,
    generatedAt: new Date().toISOString(),
  });
}
