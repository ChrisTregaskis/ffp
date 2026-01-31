import { z } from 'zod';

import { WARNING_TYPES } from '@ffp/database/constants';

export const warningTypeSchema = z.enum(WARNING_TYPES);

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

export const warningsArraySchema = z.array(warningSchema);

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

export type WarningType = z.infer<typeof warningTypeSchema>;
export type Warning = z.infer<typeof warningSchema>;
export type WarningsArray = z.infer<typeof warningsArraySchema>;
export type BranchEvaluationResult = z.infer<typeof branchEvaluationResultSchema>;
