import { z } from 'zod';

import { USER_ASSESSMENT_STATUSES, VALID_STATUS_TRANSITIONS } from '@ffp/database';

import { dimensionalScoreSchema } from './job.schema';

export const userAssessmentStatusSchema = z.enum(USER_ASSESSMENT_STATUSES);

export type UserAssessmentStatus = z.infer<typeof userAssessmentStatusSchema>;

export const userAnswerSchema = z.object({
  /** Question ID from the assessment template */
  questionId: z.string().uuid(),
  /** Selected answer value (numeric for scales, string for text) */
  answerValue: z.union([z.number(), z.string()]),
  /** Optional: Answer ID if selecting from predefined options */
  answerId: z.string().uuid().optional(),
  /** Timestamp when answer was recorded */
  answeredAt: z.coerce.date().optional(),
});

export type UserAnswer = z.infer<typeof userAnswerSchema>;

/**
 * Answers object schema
 *
 * Keyed by questionId for efficient lookup and updates.
 * Stored as JSONB in the database.
 */
export const userAssessmentAnswersSchema = z.record(z.string().uuid(), userAnswerSchema);

export type UserAssessmentAnswers = z.infer<typeof userAssessmentAnswersSchema>;

/**
 * Scores object schema
 *
 * Contains calculated dimensional scores after scoring job completes.
 * Stored as JSONB in the database.
 */
export const userAssessmentScoresSchema = z.object({
  /** Array of dimensional scores */
  dimensions: z.array(dimensionalScoreSchema),
  /** Overall assessment score (if applicable) */
  overallScore: z.number().optional(),
  /** Risk level derived from scores */
  riskLevel: z.enum(['low', 'moderate', 'high']).optional(),
  /** Timestamp when scoring was completed */
  scoredAt: z.coerce.date(),
});

export type UserAssessmentScores = z.infer<typeof userAssessmentScoresSchema>;

/**
 * User assessment schema - full record
 *
 * Represents a complete user assessment record from the database.
 */
export const userAssessmentSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.string().uuid(),
  /** Tenant ID for RLS isolation */
  tenantId: z.string().uuid(),
  /** User who owns this assessment */
  userId: z.string().uuid(),
  /** Assessment flow being followed */
  flowId: z.string().uuid(),
  /** Current step index in the flow (1-based) */
  currentStep: z.number().int().positive(),
  /** Assessment state machine status */
  status: userAssessmentStatusSchema,
  /** User's answers (keyed by questionId) */
  answers: userAssessmentAnswersSchema,
  /** Calculated scores (null until scored) */
  scores: userAssessmentScoresSchema.nullable(),
  /** Generated programme ID (null until programme generated) */
  programmeId: z.string().uuid().nullable(),
  /** When user started the assessment */
  startedAt: z.coerce.date().nullable(),
  /** When user submitted the assessment */
  submittedAt: z.coerce.date().nullable(),
  /** When assessment flow completed */
  completedAt: z.coerce.date().nullable(),
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

export type UserAssessment = z.infer<typeof userAssessmentSchema>;

export const createUserAssessmentSchema = z.object({
  /** Tenant ID (from request context) */
  tenantId: z.string().uuid(),
  /** User ID (from request context) */
  userId: z.string().uuid(),
  /** Assessment flow to follow */
  flowId: z.string().uuid(),
});

export type CreateUserAssessmentInput = z.infer<typeof createUserAssessmentSchema>;

export const updateUserAssessmentSchema = z.object({
  /** Update current step */
  currentStep: z.number().int().positive().optional(),
  /** Merge new answers (partial update) */
  answers: userAssessmentAnswersSchema.optional(),
});

export type UpdateUserAssessmentInput = z.infer<typeof updateUserAssessmentSchema>;

export const statusTransitionSchema = z
  .object({
    /** Current status of the assessment */
    fromStatus: userAssessmentStatusSchema,
    /** Target status to transition to */
    toStatus: userAssessmentStatusSchema,
  })
  .refine(
    (data) => {
      const allowedTransitions = VALID_STATUS_TRANSITIONS[data.fromStatus];
      return allowedTransitions.includes(data.toStatus);
    },
    (data) => ({
      message: `Invalid status transition: ${data.fromStatus} → ${data.toStatus}. Allowed transitions from '${data.fromStatus}': ${VALID_STATUS_TRANSITIONS[data.fromStatus].join(', ') || 'none'}`,
    })
  );

export type StatusTransition = z.infer<typeof statusTransitionSchema>;

/**
 * Validates if a status transition is allowed
 *
 * @param fromStatus - Current assessment status
 * @param toStatus - Target status to transition to
 * @returns true if transition is valid, false otherwise
 */
export const isValidStatusTransition = (
  fromStatus: UserAssessmentStatus,
  toStatus: UserAssessmentStatus
): boolean => {
  const result = statusTransitionSchema.safeParse({ fromStatus, toStatus });
  return result.success;
};

/**
 * Gets allowed transitions from a given status
 *
 * @param status - Current assessment status
 * @returns Array of valid target statuses
 */
export const getAllowedTransitions = (status: UserAssessmentStatus): UserAssessmentStatus[] => {
  return VALID_STATUS_TRANSITIONS[status];
};

export const submitAssessmentSchema = z.object({
  /** Assessment ID being submitted */
  assessmentId: z.string().uuid(),
  /** Final answers (complete set) */
  answers: userAssessmentAnswersSchema,
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;

/**
 * Request schema for starting an assessment
 *
 * Used to validate incoming API requests to the start assessment endpoint.
 * The flowId identifies which assessment flow the user wants to begin.
 */
export const startAssessmentRequestSchema = z.object({
  /** Assessment flow ID to start (must be valid UUID) */
  flowId: z.string().uuid({ message: 'flowId must be a valid UUID' }),
});

export type StartAssessmentRequest = z.infer<typeof startAssessmentRequestSchema>;

/**
 * Response schema for starting an assessment
 *
 * Returns the assessment state to the client. The isResumed flag indicates
 * whether an existing in-progress assessment was returned (true) or a new
 * assessment was created (false).
 */
export const startAssessmentResponseSchema = z.object({
  /** Unique identifier for the assessment */
  assessmentId: z.string().uuid(),
  /** Current step index in the flow (1-based) */
  currentStep: z.number().int().positive(),
  /** Assessment state machine status */
  status: userAssessmentStatusSchema,
  /** User's answers (keyed by questionId) */
  answers: userAssessmentAnswersSchema,
  /** Assessment flow being followed */
  flowId: z.string().uuid(),
  /** True if resuming existing assessment, false if newly created */
  isResumed: z.boolean(),
});

export type StartAssessmentResponse = z.infer<typeof startAssessmentResponseSchema>;
