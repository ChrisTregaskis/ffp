import { z } from 'zod';

import { answerValueSchema } from '@ffp/database';
import { JOB_STATUSES, JOB_TYPES } from '@ffp/database/constants';

export const jobStatusSchema = z.enum(JOB_STATUSES);

export type JobStatus = z.infer<typeof jobStatusSchema>;

export const jobTypeSchema = z.enum(JOB_TYPES);

export type JobType = z.infer<typeof jobTypeSchema>;

// ============================================================================
// SCORE_ASSESSMENT JOB PAYLOAD & RESULT
// ============================================================================

/**
 * Individual response to an assessment question
 */
export const assessmentResponseSchema = z.object({
  /** Question ID from the assessment template */
  questionId: z.string().uuid(),
  /** Selected answer value - uses shared schema from @ffp/database */
  answerValue: answerValueSchema,
  /** Optional: Answer ID if selecting from predefined options */
  answerId: z.string().uuid().optional(),
});

export type AssessmentResponse = z.infer<typeof assessmentResponseSchema>;

/**
 * Payload for score_assessment job type
 *
 * Contains all data needed to calculate dimensional scores from
 * a completed assessment submission.
 *
 * Note: Uses flowId (not templateId) because scoring configuration
 * lives at the flow level, combining dimensions from all templates.
 */
export const scoreAssessmentPayloadSchema = z.object({
  /** The user_assessments record ID being scored */
  userAssessmentId: z.string().uuid(),
  /** The flow containing the scoring configuration */
  flowId: z.string().uuid(),
  /** User who completed the assessment */
  userId: z.string().uuid(),
  /** Array of question responses to score */
  responses: z.array(assessmentResponseSchema).min(1),
});

export type ScoreAssessmentPayload = z.infer<typeof scoreAssessmentPayloadSchema>;

/**
 * Dimensional score result from assessment scoring
 */
export const dimensionalScoreSchema = z.object({
  /** Dimension identifier (e.g., 'mobility', 'strength', 'stability') */
  dimensionId: z.string(),
  /** Dimension display name */
  dimensionName: z.string(),
  /** Raw score value */
  rawScore: z.number(),
  /** Normalised score (0-100 scale) */
  normalisedScore: z.number(),
  /** Score category (e.g., 'low', 'moderate', 'high') */
  category: z.string().optional(),
});

export type DimensionalScore = z.infer<typeof dimensionalScoreSchema>;

/**
 * Result for score_assessment job type
 *
 * Contains calculated dimensional scores from the scoring algorithm.
 */
export const scoreAssessmentResultSchema = z.object({
  /** Array of dimensional scores */
  scores: z.array(dimensionalScoreSchema).min(1),
  /** Overall assessment score (if applicable) */
  overallScore: z.number().optional(),
  /** Timestamp when scoring was completed */
  scoredAt: z.string().datetime(),
});

export type ScoreAssessmentResult = z.infer<typeof scoreAssessmentResultSchema>;

// ============================================================================
// GENERATE_PROGRAM JOB PAYLOAD & RESULT
// ============================================================================

/**
 * Payload for generate_program job type
 *
 * Contains scored assessment data needed to generate a personalised
 * workout programme from the video catalogue.
 */
export const generateProgramPayloadSchema = z.object({
  /** The scored assessment submission ID */
  assessmentSubmissionId: z.string().uuid(),
  /** User for whom the programme is being generated */
  userId: z.string().uuid(),
  /** Dimensional scores from the assessment */
  scores: z.array(dimensionalScoreSchema).min(1),
  /** Optional: Specific focus areas requested by user */
  focusAreas: z.array(z.string()).optional(),
  /** Optional: Programme duration preference in weeks */
  durationWeeks: z.number().int().positive().optional(),
});

export type GenerateProgramPayload = z.infer<typeof generateProgramPayloadSchema>;

/**
 * Exercise summary for programme generation result
 *
 * Minimal reference to exercises included in the generated programme.
 * Full exercise details (targetDimensions, etc.) available from the catalogue.
 */
export const exerciseSummarySchema = z.object({
  /** Exercise/video ID from the catalogue */
  exerciseId: z.string().uuid(),
  /** Exercise name (denormalised for display without lookup) */
  name: z.string(),
});

export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;

/**
 * Result for generate_program job type
 *
 * Contains the generated programme ID and summary of included exercises.
 */
export const generateProgramResultSchema = z.object({
  /** The generated programme ID */
  programId: z.string().uuid(),
  /** Programme name */
  programName: z.string(),
  /** Duration in weeks */
  durationWeeks: z.number().int().positive(),
  /** Summary of exercises included */
  exercises: z.array(exerciseSummarySchema),
  /** Number of workout sessions per week */
  sessionsPerWeek: z.number().int().positive(),
  /** Timestamp when programme was generated */
  generatedAt: z.string().datetime(),
});

export type GenerateProgramResult = z.infer<typeof generateProgramResultSchema>;

// ============================================================================
// DISCRIMINATED UNION TYPES
// ============================================================================

/**
 * Job payload discriminated union
 *
 * Use this to type-safely handle different job payloads based on job type.
 */
export const jobPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('score_assessment'), data: scoreAssessmentPayloadSchema }),
  z.object({ type: z.literal('generate_program'), data: generateProgramPayloadSchema }),
]);

export type JobPayload = z.infer<typeof jobPayloadSchema>;

/**
 * Job result discriminated union
 *
 * Use this to type-safely handle different job results based on job type.
 */
export const jobResultSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('score_assessment'), data: scoreAssessmentResultSchema }),
  z.object({ type: z.literal('generate_program'), data: generateProgramResultSchema }),
]);

export type JobResult = z.infer<typeof jobResultSchema>;

// ============================================================================
// PROCESS JOB SCHEMA
// ============================================================================

/**
 * Process job schema - full job record
 *
 * Represents a complete job record from the process_jobs table.
 * Jobs are tenant-scoped via RLS for data isolation.
 */
export const processJobSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.string().uuid(),
  /** Tenant ID for RLS isolation */
  tenantId: z.string().uuid(),
  /** Job type determining payload/result structure */
  type: jobTypeSchema,
  /** Current job status */
  status: jobStatusSchema,
  /** Job priority: 1=urgent, 2=high, 3=medium, 4=low (default) */
  priority: z.number().int().min(1).max(4),
  /** Job-specific payload data */
  payload: z.record(z.unknown()),
  /** Job result (populated on completion) */
  result: z.record(z.unknown()).nullable(),
  /** Number of execution attempts */
  attempts: z.number().int().nonnegative(),
  /** Maximum allowed attempts before marking as failed */
  maxAttempts: z.number().int().positive(),
  /** Human-readable status message (e.g., progress info, failure reason) */
  message: z.string().nullable(),
  /** Earliest time this job can be retried (null = immediately available) */
  retryAfter: z.date().nullable(),
  /** Timestamp when job was created */
  createdAt: z.date(),
  /** Timestamp when job started processing */
  startedAt: z.date().nullable(),
  /** Timestamp when job completed (success or failure) */
  completedAt: z.date().nullable(),
});

export type ProcessJob = z.infer<typeof processJobSchema>;

/**
 * Create process job schema - input for enqueueing new jobs
 *
 * Omits auto-generated fields and sets sensible defaults.
 */
export const createProcessJobSchema = z.object({
  /** Tenant ID (extracted from request context) */
  tenantId: z.string().uuid(),
  /** Job type */
  type: jobTypeSchema,
  /** Job payload matching the type */
  payload: z.record(z.unknown()),
  /** Optional: Override default priority (1=urgent, 2=high, 3=medium, 4=low) */
  priority: z.number().int().min(1).max(4).optional(),
  /** Optional: Override default max attempts (default: 3) */
  maxAttempts: z.number().int().positive().optional(),
});

export type CreateProcessJobInput = z.infer<typeof createProcessJobSchema>;
