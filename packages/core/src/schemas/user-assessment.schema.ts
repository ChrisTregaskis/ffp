import { z } from 'zod';

import {
  USER_ASSESSMENT_STATUSES,
  VALID_STATUS_TRANSITIONS,
  WARNING_TYPES,
} from '@ffp/database/constants';
import { answerValueSchema } from '@ffp/database/types';

import { dimensionalScoreSchema } from './job.schema';

export const userAssessmentStatusSchema = z.enum(USER_ASSESSMENT_STATUSES);

export const userAnswerSchema = z.object({
  /** Question ID from the assessment template */
  questionId: z.string().uuid(),
  /** Selected answer value - uses shared schema from @ffp/database */
  answerValue: answerValueSchema,
  /** Optional: Answer ID if selecting from predefined options */
  answerId: z.string().uuid().optional(),
  /** Timestamp when answer was recorded */
  answeredAt: z.coerce.date().optional(),
});

/**
 * Keyed by questionId for efficient lookup and updates.
 * Stored as JSONB in the database.
 */
export const userAssessmentAnswersSchema = z.record(z.string().uuid(), userAnswerSchema);

/**
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

/** Represents a complete user assessment record from the database. */
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

/** Derived from userAssessmentSchema - picks fields required for creation */
export const createUserAssessmentSchema = userAssessmentSchema.pick({
  tenantId: true,
  userId: true,
  flowId: true,
});

/** Derived from userAssessmentSchema - picks mutable fields, all optional via .partial() */
export const updateUserAssessmentSchema = userAssessmentSchema
  .pick({
    currentStep: true,
  })
  .partial();

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

/** Validates if a status transition is allowed */
export const isValidStatusTransition = (
  fromStatus: UserAssessmentStatus,
  toStatus: UserAssessmentStatus
): boolean => {
  const result = statusTransitionSchema.safeParse({ fromStatus, toStatus });
  return result.success;
};

/** Gets allowed transitions from a given status */
export const getAllowedTransitions = (status: UserAssessmentStatus): UserAssessmentStatus[] => {
  return VALID_STATUS_TRANSITIONS[status];
};

export const submitAssessmentSchema = z.object({
  /** Assessment ID being submitted */
  assessmentId: z.string().uuid(),
  /** Final answers (complete set) */
  answers: userAssessmentAnswersSchema,
});

export const startAssessmentRequestSchema = z.object({
  /** Assessment flow ID to start (must be valid UUID) */
  flowId: z.string().uuid({ message: 'flowId must be a valid UUID' }),
});

/**
 * Minimal step information needed for the client to navigate
 * through the assessment flow. Includes branching indicators.
 */
export const flowStepSummarySchema = z.object({
  /** Unique step identifier (UUID) */
  id: z.string().uuid(),
  /** Step tier/order (multiple steps can share same order for parallel branches) */
  order: z.number().int().positive(),
  /** Step type (intro, questions, transition, etc.) */
  type: z.string(),
  /** Step display configuration */
  config: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
  /** Template ID for question/video steps (optional) */
  templateId: z.string().uuid().nullable().optional(),
  /** Whether this step has branching rules */
  hasBranchingRules: z.boolean(),
  /** Default next step ID (for linear progression) */
  defaultNextStepId: z.string().uuid().nullable().optional(),
});

export const startAssessmentResponseSchema = z.object({
  /** Unique identifier for the assessment */
  assessmentId: z.string().uuid(),
  /** Current step index in the flow (1-based) */
  currentStep: z.number().int().positive(),
  /** Current step UUID (for step-based navigation) */
  currentStepId: z.string().uuid().optional(),
  /** Assessment state machine status */
  status: userAssessmentStatusSchema,
  /** User's answers (keyed by questionId) */
  answers: userAssessmentAnswersSchema,
  /** Assessment flow being followed */
  flowId: z.string().uuid(),
  /** True if resuming existing assessment, false if newly created */
  isResumed: z.boolean(),
  /** Flow steps for client-side navigation (from normalised flow_steps table) */
  steps: z.array(flowStepSummarySchema),
});

export const saveProgressRequestSchema = z.object({
  /** Answers to merge with existing (can be empty for step-only updates) */
  answers: userAssessmentAnswersSchema,
  /** Current step index in the flow (1-based) */
  currentStep: z.number().int().positive({ message: 'currentStep must be a positive integer' }),
});

export const assessmentWarningSchema = z.object({
  /** Warning message displayed to user */
  message: z.string().min(1),
  /** Severity level of the warning */
  type: z.enum(WARNING_TYPES),
  /** ISO timestamp when warning was shown */
  shownAt: z.string().datetime(),
  /** Step ID where warning was triggered (optional) */
  stepId: z.string().uuid().optional(),
  /** Question slug that triggered the warning (optional) */
  triggeredBy: z.string().optional(),
});

export const saveProgressResponseSchema = z.object({
  /** Indicates the save was successful */
  success: z.literal(true),
  /** ISO 8601 timestamp of when the progress was updated */
  updatedAt: z.string().datetime(),
  /** UUID of the next step to navigate to (from branching evaluation) */
  nextStepId: z.string().uuid().nullable(),
  /** Warnings to display to the user */
  warnings: z.array(assessmentWarningSchema),
  /** Whether the assessment should terminate early */
  shouldTerminate: z.boolean(),
  /** Reason for early termination (null if shouldTerminate is false) */
  terminationReason: z.string().nullable(),
});

export const submitAssessmentRequestSchema = z.object({
  /** Final answers to submit (merged with existing answers) */
  answers: userAssessmentAnswersSchema,
});

export const submitAssessmentResponseSchema = z.object({
  /** UUID of the enqueued scoring job for status polling */
  jobId: z.string().uuid(),
  /** Human-readable message confirming submission */
  message: z.string(),
});

export const assessmentResultsResponseSchema = z.object({
  /** Current assessment status (submitted, scored, completed, etc.) */
  status: userAssessmentStatusSchema,
  /** Calculated assessment scores (null until scoring completes) */
  scores: userAssessmentScoresSchema.nullable(),
  /** Recommended programme ID (null until programme assigned) */
  programmeId: z.string().uuid().nullable(),
});

export type AnswerValue = z.infer<typeof answerValueSchema>;
export type UserAssessmentStatus = z.infer<typeof userAssessmentStatusSchema>;
export type UserAnswer = z.infer<typeof userAnswerSchema>;
export type UserAssessmentAnswers = z.infer<typeof userAssessmentAnswersSchema>;
export type UserAssessmentScores = z.infer<typeof userAssessmentScoresSchema>;
export type UserAssessment = z.infer<typeof userAssessmentSchema>;
export type CreateUserAssessmentInput = z.infer<typeof createUserAssessmentSchema>;
export type UpdateUserAssessmentInput = z.infer<typeof updateUserAssessmentSchema>;
export type StatusTransition = z.infer<typeof statusTransitionSchema>;
export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
export type StartAssessmentRequest = z.infer<typeof startAssessmentRequestSchema>;
export type FlowStepSummary = z.infer<typeof flowStepSummarySchema>;
export type StartAssessmentResponse = z.infer<typeof startAssessmentResponseSchema>;
export type SaveProgressRequest = z.infer<typeof saveProgressRequestSchema>;
export type AssessmentWarning = z.infer<typeof assessmentWarningSchema>;
export type SaveProgressResponse = z.infer<typeof saveProgressResponseSchema>;
export type SubmitAssessmentRequest = z.infer<typeof submitAssessmentRequestSchema>;
export type SubmitAssessmentResponse = z.infer<typeof submitAssessmentResponseSchema>;
export type AssessmentResultsResponse = z.infer<typeof assessmentResultsResponseSchema>;
