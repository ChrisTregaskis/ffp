import { z } from 'zod';

import {
  USER_ASSESSMENT_STATUSES,
  VALID_STATUS_TRANSITIONS,
  WARNING_TYPES,
} from '@ffp/database/constants';
import { answerValueSchema, userAssessmentScoresSchema } from '@ffp/database/types';

export const userAssessmentStatusSchema = z.enum(USER_ASSESSMENT_STATUSES);

export const userAnswerSchema = z.object({
  /** Question ID from the assessment template */
  questionId: z.guid(),
  /** Selected answer value - uses shared schema from @ffp/database */
  answerValue: answerValueSchema,
  /** Optional: Answer ID if selecting from predefined options */
  answerId: z.guid().optional(),
  /** Timestamp when answer was recorded */
  answeredAt: z.coerce.date().optional(),
});

/**
 * Keyed by questionId for efficient lookup and updates.
 * Stored as JSONB in the database.
 */
export const userAssessmentAnswersSchema = z.record(z.guid(), userAnswerSchema);

export { userAssessmentScoresSchema };

/** Represents a complete user assessment record from the database. */
export const userAssessmentSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Organisation ID for RLS isolation */
  organisationId: z.guid(),
  /** User who owns this assessment */
  userId: z.guid(),
  /** Assessment flow being followed */
  flowId: z.guid(),
  /** Current step index in the flow (1-based) */
  currentStep: z.number().int().positive(),
  /** Assessment state machine status */
  status: userAssessmentStatusSchema,
  /** Calculated scores (null until scored) */
  scores: userAssessmentScoresSchema.nullable(),
  /** Generated programme ID (null until programme generated) */
  programmeId: z.guid().nullable(),
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
  organisationId: true,
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
  .superRefine((data, ctx) => {
    const allowedTransitions = VALID_STATUS_TRANSITIONS[data.fromStatus];

    if (!allowedTransitions.includes(data.toStatus)) {
      ctx.addIssue({
        code: 'custom',
        message: `Invalid status transition: ${data.fromStatus} → ${data.toStatus}. Allowed transitions from '${data.fromStatus}': ${VALID_STATUS_TRANSITIONS[data.fromStatus].join(', ') || 'none'}`,
      });
    }
  });

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

export const assessmentWarningSchema = z.object({
  /** Warning message displayed to user */
  message: z.string().min(1),
  /** Severity level of the warning */
  type: z.enum(WARNING_TYPES),
  /** ISO timestamp when warning was shown */
  shownAt: z.iso.datetime(),
  /** Step ID where warning was triggered (optional) */
  stepId: z.guid().optional(),
  /** Question slug that triggered the warning (optional) */
  triggeredBy: z.string().optional(),
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
export type AssessmentWarning = z.infer<typeof assessmentWarningSchema>;
