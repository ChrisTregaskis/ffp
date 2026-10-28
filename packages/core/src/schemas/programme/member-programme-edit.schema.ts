import { z } from 'zod';

import { SESSION_STATUSES } from '@ffp/database/constants';

import { sessionExerciseSchema } from '../programme-structure.schema';

/**
 * One exercise in a member's own session, as an admin edit returns it. The request bodies are the
 * template exercise ones: the same prescription fields, keyed to the member's rows instead.
 */
export const memberExerciseResponseSchema = sessionExerciseSchema
  .pick({
    id: true,
    videoId: true,
    orderIndex: true,
    sets: true,
    reps: true,
    durationSeconds: true,
    restSeconds: true,
    notes: true,
  })
  .extend({ userSessionId: z.guid() });

/** A member session's place in its phase after a reorder */
export const memberSessionOrderResponseSchema = z.object({
  id: z.guid(),
  sessionNumber: z.number().int().positive(),
  status: z.enum(SESSION_STATUSES),
});

export type MemberExerciseResponse = z.infer<typeof memberExerciseResponseSchema>;
export type MemberSessionOrderResponse = z.infer<typeof memberSessionOrderResponseSchema>;
