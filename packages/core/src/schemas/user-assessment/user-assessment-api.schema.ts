import { z } from 'zod';

import { userAssessmentScoresSchema } from '@ffp/database/types';

import {
  userAssessmentStatusSchema,
  userAssessmentAnswersSchema,
  assessmentWarningSchema,
} from './user-assessment-entity.schema';

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

/**
 * The consent gate on the member's result. `required` says the answers raised safety
 * advice and stays true afterwards; the result is held while `required` is true and
 * `acknowledgedAt` is null.
 */
export const safetyGateSchema = z.object({
  /** True when the answers raised a safety warning */
  required: z.boolean(),
  /** ISO 8601 timestamp of the member's confirmation (null until they give it) */
  acknowledgedAt: z.iso.datetime().nullable(),
  /** The advice the member was given (null when none was) */
  advice: z.string().nullable(),
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
  /** The result's consent gate, when resuming a submitted assessment (null before submission) */
  safetyGate: safetyGateSchema.nullable(),
});

export const saveProgressRequestSchema = z.object({
  /** Answers to merge with existing (can be empty for step-only updates) */
  answers: userAssessmentAnswersSchema,
  /** Current step index in the flow (1-based) */
  currentStep: z.number().int().positive({ message: 'currentStep must be a positive integer' }),
  /**
   * True when the member is leaving `currentStep` for the next step. Only then is the stored
   * position moved on to the step branching picks; any other save keeps it on `currentStep`.
   */
  advance: z.boolean().optional(),
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

/**
 * The scores a member is shown. The risk level and the recommended template are scoring
 * internals the member surface never displays; the admin dry-run keeps both.
 */
export const memberAssessmentScoresSchema = userAssessmentScoresSchema.omit({
  riskLevel: true,
  recommendedTemplateSlug: true,
});

export const programmeReadinessSchema = z.enum(['pending', 'ready', 'failed']);

export const assessmentResultsResponseSchema = z.object({
  /** Current assessment status (submitted, scored, completed, etc.) */
  status: userAssessmentStatusSchema,
  /** Calculated assessment scores (null until scoring completes) */
  scores: memberAssessmentScoresSchema.nullable(),
  /** Recommended programme ID (null until programme assigned) */
  programmeId: z.guid().nullable(),
  /** Whether the programme is ready, still being put together, or could not be put together */
  programmeReadiness: programmeReadinessSchema,
  /** Display name of the recommended programme (from the scoring recommendation, falling back to the linked programme; null when neither is known) */
  programmeName: z.string().nullable(),
  /** The consent gate on the result (held while required and not yet acknowledged) */
  safetyGate: safetyGateSchema,
});

export const userAssessmentStatusResponseSchema = z.object({
  /** Whether the user has an active programme */
  hasProgramme: z.boolean(),
  /** Whether the user has ever had any programme (regardless of current status) */
  hasEverHadProgramme: z.boolean(),
  /** Assessment flow ID to redirect to (null if user has a programme or no active flow) */
  assessmentFlowId: z.guid().nullable(),
});

export type ProgrammeReadiness = z.infer<typeof programmeReadinessSchema>;
export type StartAssessmentRequest = z.infer<typeof startAssessmentRequestSchema>;
export type FlowStepSummary = z.infer<typeof flowStepSummarySchema>;
export type SafetyGate = z.infer<typeof safetyGateSchema>;
export type StartAssessmentResponse = z.infer<typeof startAssessmentResponseSchema>;
export type SaveProgressRequest = z.infer<typeof saveProgressRequestSchema>;
export type SaveProgressResponse = z.infer<typeof saveProgressResponseSchema>;
export type SubmitAssessmentRequest = z.infer<typeof submitAssessmentRequestSchema>;
export type SubmitAssessmentResponse = z.infer<typeof submitAssessmentResponseSchema>;
export type MemberAssessmentScores = z.infer<typeof memberAssessmentScoresSchema>;
export type AssessmentResultsResponse = z.infer<typeof assessmentResultsResponseSchema>;
export type UserAssessmentStatusResponse = z.infer<typeof userAssessmentStatusResponseSchema>;
