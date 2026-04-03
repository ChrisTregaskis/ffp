import { z } from 'zod';

/** Progress summary response for GET /programmes/active/progress */
export const progressSummaryResponseSchema = z.object({
  programmeId: z.guid(),
  programmeName: z.string(),
  totalPhases: z.number().int().nonnegative(),
  completedPhases: z.number().int().nonnegative(),
  currentPhaseNumber: z.number().int().positive().nullable(),
  totalSessions: z.number().int().nonnegative(),
  completedSessions: z.number().int().nonnegative(),
  skippedSessions: z.number().int().nonnegative(),
  totalExercises: z.number().int().nonnegative(),
  completedExercises: z.number().int().nonnegative(),
  overallProgressPercent: z.number().int().min(0).max(100),
  currentPhaseProgressPercent: z.number().int().min(0).max(100),
  startedAt: z.coerce.date().nullable(),
});

export type ProgressSummaryResponse = z.infer<typeof progressSummaryResponseSchema>;
