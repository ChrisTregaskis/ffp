import { z } from 'zod';

import { userAssessmentScoresSchema } from '@ffp/database/types';

import {
  userAssessmentStatusSchema,
  userAssessmentAnswersSchema,
  assessmentWarningSchema,
} from './user-assessment-entity.schema';

export const submitAssessmentSchema = z.object({
  /** Assessment ID being submitted */
  assessmentId: z.guid(),
  /** Final answers (complete set) */
  answers: userAssessmentAnswersSchema,
});

export const startAssessmentRequestSchema = z.object({
  /** Assessment flow ID to start (must be valid UUID) */
  flowId: z.guid({ message: 'flowId must be a valid GUID' }),
  /** When true, create a new assessment instead of resuming an existing one (reassessment path). */
  isReassessment: z.boolean().optional(),
});

/**
 * Minimal step information needed for the client to navigate
 * through the assessment flow. Includes branching indicators.
 */
export const flowStepSummarySchema = z.object({
  /** Unique step identifier (UUID) */
  id: z.guid(),
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
  templateId: z.guid().nullable().optional(),
  /** Whether this step has branching rules */
  hasBranchingRules: z.boolean(),
  /** Default next step ID (for linear progression) */
  defaultNextStepId: z.guid().nullable().optional(),
});

export const startAssessmentResponseSchema = z.object({
  /** Unique identifier for the assessment */
  assessmentId: z.guid(),
  /** Current step index in the flow (1-based) */
  currentStep: z.number().int().positive(),
  /** Current step UUID (for step-based navigation) */
  currentStepId: z.guid().optional(),
  /** Assessment state machine status */
  status: userAssessmentStatusSchema,
  /** User's answers (keyed by questionId) */
  answers: userAssessmentAnswersSchema,
  /** Assessment flow being followed */
  flowId: z.guid(),
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

export const saveProgressResponseSchema = z.object({
  /** Indicates the save was successful */
  success: z.literal(true),
  /** ISO 8601 timestamp of when the progress was updated */
  updatedAt: z.iso.datetime(),
  /** UUID of the next step to navigate to (from branching evaluation) */
  nextStepId: z.guid().nullable(),
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
  jobId: z.guid(),
  /** Human-readable message confirming submission */
  message: z.string(),
});

export const assessmentResultsResponseSchema = z.object({
  /** Current assessment status (submitted, scored, completed, etc.) */
  status: userAssessmentStatusSchema,
  /** Calculated assessment scores (null until scoring completes) */
  scores: userAssessmentScoresSchema.nullable(),
  /** Recommended programme ID (null until programme assigned) */
  programmeId: z.guid().nullable(),
  /** Display name of the recommended programme (null until programme assigned) */
  programmeName: z.string().nullable(),
});

export const userAssessmentStatusResponseSchema = z.object({
  /** Whether the user has an active programme */
  hasProgramme: z.boolean(),
  /** Whether the user has ever had any programme (regardless of current status) */
  hasEverHadProgramme: z.boolean(),
  /** Assessment flow ID to redirect to (null if user has a programme or no active flow) */
  assessmentFlowId: z.guid().nullable(),
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentSchema>;
export type StartAssessmentRequest = z.infer<typeof startAssessmentRequestSchema>;
export type FlowStepSummary = z.infer<typeof flowStepSummarySchema>;
export type StartAssessmentResponse = z.infer<typeof startAssessmentResponseSchema>;
export type SaveProgressRequest = z.infer<typeof saveProgressRequestSchema>;
export type SaveProgressResponse = z.infer<typeof saveProgressResponseSchema>;
export type SubmitAssessmentRequest = z.infer<typeof submitAssessmentRequestSchema>;
export type SubmitAssessmentResponse = z.infer<typeof submitAssessmentResponseSchema>;
export type AssessmentResultsResponse = z.infer<typeof assessmentResultsResponseSchema>;
export type UserAssessmentStatusResponse = z.infer<typeof userAssessmentStatusResponseSchema>;
