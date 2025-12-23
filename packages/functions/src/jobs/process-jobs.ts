import {
  pollAndClaimJobs,
  completeJob,
  failJob,
  extractJobContext,
  Logger,
  SystemLogger,
  type JobProcessorConfig,
} from '@ffp/core/server';
import { getDb, type ProcessJobRecord, type JobType } from '@ffp/database';

import type { ScheduledEvent } from 'aws-lambda';

// ============================================================================
// Job Payload Types (input to handlers)
// ============================================================================
//
// NOTE: These are placeholder types for handler signatures. When implementing
// actual handlers (FFP-133/134), import types inferred from Zod schemas in
// @ffp/core/schemas/job.schema.ts to ensure type consistency with queue payloads.

/** Payload for score_assessment jobs */
interface ScoreAssessmentPayload {
  assessmentId: string;
  // TODO: FFP-133 - Add additional fields as needed
}

/** Payload for generate_program jobs */
interface GenerateProgramPayload {
  assessmentId: string;
  // TODO: FFP-134 - Add additional fields as needed
}

/** Map job type to its payload type */
interface JobPayloadMap {
  score_assessment: ScoreAssessmentPayload;
  generate_program: GenerateProgramPayload;
}

// ============================================================================
// Job Result Types (output from handlers)
// ============================================================================
//
// NOTE: These are placeholder types that will be replaced by imports from
// @ffp/core/schemas when FFP-133 (Scoring Service) and FFP-134 (Programme
// Generation Service) are implemented. The Zod schemas in job.schema.ts
// define the canonical result structures for database storage.

/** Base result type - allows indexing for Record<string, unknown> compatibility */
interface BaseJobResult {
  status: string;
  processedAt: string;
  [key: string]: unknown;
}

/** Result for score_assessment jobs */
interface ScoreAssessmentResult extends BaseJobResult {
  status: 'scored';
  scores: {
    strength: number;
    balance: number;
    flexibility: number;
  };
}

/** Result for generate_program jobs */
interface GenerateProgramResult extends BaseJobResult {
  status: 'generated';
  programmeId: string | null;
  exerciseCount: number;
}

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
 */
export const handler = async (event: ScheduledEvent): Promise<void> => {
  const sysLogger = new SystemLogger('job-processor');

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
      });

      try {
        // Route to appropriate handler based on job type
        const result = processJobByType(job);

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
 * @returns Typed result object to store in job.result
 */
function processJobByType<T extends JobType>(job: ProcessJobRecord & { type: T }): JobResultMap[T] {
  switch (job.type) {
    case 'score_assessment':
      return handleScoreAssessment(
        job.payload as JobPayloadMap['score_assessment']
      ) as JobResultMap[T];

    case 'generate_program':
      return handleGenerateProgram(
        job.payload as JobPayloadMap['generate_program']
      ) as JobResultMap[T];

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
 * @param _payload - Assessment scoring payload
 * @returns Scoring result
 */
function handleScoreAssessment(_payload: ScoreAssessmentPayload): ScoreAssessmentResult {
  // TODO: FFP-133 - Implement actual scoring logic
  // Logging will be added when service is implemented with proper context

  // Placeholder: Return mock result structure
  return {
    status: 'scored',
    scores: {
      // Placeholder scores - will be replaced with actual calculation
      strength: 0,
      balance: 0,
      flexibility: 0,
    },
    processedAt: new Date().toISOString(),
  };
}

/**
 * Handle generate_program job
 *
 * Placeholder until FFP-134 (Programme Generation Service) is implemented.
 * Will generate personalised workout programme from assessment scores.
 *
 * @param _payload - Programme generation payload
 * @returns Generated programme result
 */
function handleGenerateProgram(_payload: GenerateProgramPayload): GenerateProgramResult {
  // TODO: FFP-134 - Implement actual programme generation logic
  // Logging will be added when service is implemented with proper context

  // Placeholder: Return mock result structure
  return {
    status: 'generated',
    programmeId: null, // Will be actual programme ID when implemented
    exerciseCount: 0,
    processedAt: new Date().toISOString(),
  };
}
