import { z } from 'zod';

import { JOB_STATUSES, JOB_TYPES } from '@ffp/database/constants';
import { answerValueSchema, dimensionalScoreSchema } from '@ffp/database/types';

export const jobStatusSchema = z.enum(JOB_STATUSES);
export const jobTypeSchema = z.enum(JOB_TYPES);

// Individual response to an assessment question
export const assessmentResponseSchema = z.object({
  /** Question ID from the assessment template */
  questionId: z.guid(),
  /** Selected answer value - uses shared schema from @ffp/database */
  answerValue: answerValueSchema,
  /** Optional: Answer ID if selecting from predefined options */
  answerId: z.guid().optional(),
});

/**
 * Contains all data needed to calculate dimensional scores from
 * a completed assessment submission.
 */
export const scoreAssessmentPayloadSchema = z.object({
  /** The user_assessments record ID being scored */
  userAssessmentId: z.guid(),
  /** The flow containing the scoring configuration */
  flowId: z.guid(),
  /** User who completed the assessment */
  userId: z.guid(),
  /** Array of question responses to score */
  responses: z.array(assessmentResponseSchema).min(1),
});

export { dimensionalScoreSchema };

// Contains calculated dimensional scores from the scoring algorithm.
export const scoreAssessmentResultSchema = z.object({
  /** Array of dimensional scores */
  scores: z.array(dimensionalScoreSchema).min(1),
  /** Overall assessment score (if applicable) */
  overallScore: z.number().optional(),
  /** Timestamp when scoring was completed */
  scoredAt: z.iso.datetime(),
});

/**
 * Contains scored assessment data needed to generate a personalised
 * workout programme from the video catalogue.
 */
export const generateProgrammePayloadSchema = z.object({
  /** The scored assessment submission ID */
  assessmentSubmissionId: z.guid(),
  /** User for whom the programme is being generated */
  userId: z.guid(),
  /** Dimensional scores from the assessment */
  scores: z.array(dimensionalScoreSchema).min(1),
  /** Programme template slug from scoring (e.g., 'gentle-mobility-programme') */
  recommendedTemplateSlug: z.string().min(1).optional(),
  /** Optional: Specific focus areas requested by user */
  focusAreas: z.array(z.string()).optional(),
  /** Optional: Programme duration preference in weeks */
  durationWeeks: z.number().int().positive().optional(),
});

// Minimal reference to exercises included in the generated programme.
export const exerciseSummarySchema = z.object({
  /** Exercise/video ID from the catalogue */
  exerciseId: z.guid(),
  /** Exercise name (denormalised for display without lookup) */
  name: z.string(),
});

// Contains the generated programme ID and summary of included exercises.
export const generateProgrammeResultSchema = z.object({
  /** The generated programme ID */
  programmeId: z.guid(),
  /** Programme name */
  programmeName: z.string(),
  /** Duration in weeks */
  durationWeeks: z.number().int().positive(),
  /** Summary of exercises included */
  exercises: z.array(exerciseSummarySchema),
  /** Number of workout sessions per week */
  sessionsPerWeek: z.number().int().positive(),
  /** Timestamp when programme was generated */
  generatedAt: z.iso.datetime(),
});

// Use this to type-safely handle different job payloads based on job type.
export const jobPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('score_assessment'), data: scoreAssessmentPayloadSchema }),
  z.object({ type: z.literal('generate_programme'), data: generateProgrammePayloadSchema }),
]);

// As above but for job results
export const jobResultSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('score_assessment'), data: scoreAssessmentResultSchema }),
  z.object({ type: z.literal('generate_programme'), data: generateProgrammeResultSchema }),
]);

export const processJobSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Tenant ID for RLS isolation */
  tenantId: z.guid(),
  /** Job type determining payload/result structure */
  type: jobTypeSchema,
  /** Current job status */
  status: jobStatusSchema,
  /** Job priority: 1=urgent, 2=high, 3=medium, 4=low (default) */
  priority: z.number().int().min(1).max(4),
  /** Job-specific payload data */
  payload: z.record(z.string(), z.unknown()),
  /** Job result (populated on completion) */
  result: z.record(z.string(), z.unknown()).nullable(),
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

export const createProcessJobSchema = processJobSchema
  .pick({
    tenantId: true,
    type: true,
    payload: true,
  })
  .extend({
    priority: processJobSchema.shape.priority.optional(),
    maxAttempts: processJobSchema.shape.maxAttempts.optional(),
  });

// Score assessment types
export type AssessmentResponse = z.infer<typeof assessmentResponseSchema>;
export type ScoreAssessmentPayload = z.infer<typeof scoreAssessmentPayloadSchema>;
export type DimensionalScore = z.infer<typeof dimensionalScoreSchema>;
export type ScoreAssessmentResult = z.infer<typeof scoreAssessmentResultSchema>;

// Generate programme types
export type GenerateProgrammePayload = z.infer<typeof generateProgrammePayloadSchema>;
export type ExerciseSummary = z.infer<typeof exerciseSummarySchema>;
export type GenerateProgrammeResult = z.infer<typeof generateProgrammeResultSchema>;

// Process job types
export type JobPayload = z.infer<typeof jobPayloadSchema>;
export type JobResult = z.infer<typeof jobResultSchema>;
export type ProcessJob = z.infer<typeof processJobSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type CreateProcessJobInput = z.infer<typeof createProcessJobSchema>;
