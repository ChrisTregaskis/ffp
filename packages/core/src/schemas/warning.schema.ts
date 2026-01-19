import { z } from 'zod';

/**
 * Warning type enumeration - severity levels for assessment warnings
 *
 * Used to categorise warnings shown to users during assessments:
 * - info: Informational message, no concern
 * - caution: User should be aware, may need attention
 * - seek_medical: User should consult a medical professional before proceeding
 */
export const warningTypeSchema = z.enum(['info', 'caution', 'seek_medical']);

export type WarningType = z.infer<typeof warningTypeSchema>;

/**
 * Warning schema - represents a warning shown during assessment
 *
 * Tracks warnings displayed to users for audit purposes and to
 * prevent duplicate warnings on resume. This schema validates
 * the structure stored in user_assessments.warnings_shown.
 */
export const warningSchema = z.object({
  /** Warning message displayed to user */
  message: z.string().min(1),

  /** Severity level of the warning */
  type: warningTypeSchema,

  /** ISO timestamp when warning was shown */
  shownAt: z.string().datetime(),

  /** Step ID where warning was triggered (optional for context) */
  stepId: z.string().uuid().optional(),

  /** Question slug that triggered the warning (optional for context) */
  triggeredBy: z.string().optional(),
});

export type Warning = z.infer<typeof warningSchema>;

/**
 * Array of warnings schema - validates the warnings_shown JSONB column
 */
export const warningsArraySchema = z.array(warningSchema);

export type WarningsArray = z.infer<typeof warningsArraySchema>;

/**
 * Branch evaluation result schema - output from branch evaluator service
 *
 * Contains the next step to navigate to, any warnings to display,
 * and whether the assessment should terminate early.
 */
export const branchEvaluationResultSchema = z.object({
  /** UUID of the next step to navigate to, or null if end of flow */
  nextStepId: z.string().uuid().nullable(),

  /** Warnings to display to the user */
  warnings: z.array(warningSchema),

  /** Whether the assessment should terminate early */
  shouldTerminate: z.boolean(),

  /** Reason for early termination (if applicable) */
  terminationReason: z.string().optional(),
});

export type BranchEvaluationResult = z.infer<typeof branchEvaluationResultSchema>;
