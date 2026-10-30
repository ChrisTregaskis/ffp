import { z } from 'zod';

import { SESSION_STATUSES, type SessionStatus } from '@ffp/database/constants';

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

/**
 * Why a session the member has begun cannot change: a start copies its exercises. The server
 * refuses an edit with these, and the admin editor shows them on the locked session.
 */
export const LOCKED_SESSION_REASONS: Record<Exclude<SessionStatus, 'not_started'>, string> = {
  in_progress: 'This session is under way, so it can no longer be changed.',
  completed: 'This session is completed, so it can no longer be changed.',
  skipped: 'This session was skipped, so it can no longer be changed.',
};
