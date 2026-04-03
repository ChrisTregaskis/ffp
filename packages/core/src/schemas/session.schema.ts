import { z } from 'zod';

import { SESSION_STATUSES } from '@ffp/database/constants';

export const sessionStatusSchema = z.enum(SESSION_STATUSES);

/** Request body for POST /sessions/start — lazy session creation */
export const startSessionRequestSchema = z.object({
  /** Programme phase to create the session in */
  programmePhaseId: z.guid(),
  /** Template session to instantiate */
  templateSessionId: z.guid(),
});

/** Request body for PUT /sessions/{id}/complete or PUT /sessions/{id}/skip */
export const updateSessionStatusSchema = z.object({
  /** Target status (only completed or skipped allowed via this endpoint) */
  status: z.enum(['completed', 'skipped']),
});

/** Request body for PUT /exercises/{completionId}/complete — toggle completion */
export const toggleExerciseCompletionSchema = z.object({
  /** Whether the exercise is completed */
  completed: z.boolean(),
});

/** Individual exercise completion shape in API responses */
export const exerciseCompletionResponseSchema = z.object({
  /** Completion record ID */
  id: z.guid(),
  /** Parent user session */
  userSessionId: z.guid(),
  /** Template exercise reference */
  sessionExerciseId: z.guid(),
  /** Denormalised video reference */
  videoId: z.guid(),
  /** Whether the exercise was completed */
  completed: z.boolean(),
  /** When marked complete */
  completedAt: z.coerce.date().nullable(),
  /** Whether the exercise was skipped */
  skipped: z.boolean(),
  /** User notes */
  notes: z.string().nullable(),
  /** Variable optional data */
  metadata: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Full user session shape in API responses */
export const userSessionResponseSchema = z.object({
  /** Session record ID */
  id: z.guid(),
  /** Organisation for RLS isolation */
  organisationId: z.guid(),
  /** Parent programme phase */
  programmePhaseId: z.guid(),
  /** Source template session */
  templateSessionId: z.guid(),
  /** Ordinal position within phase (1-based) */
  sessionNumber: z.number().int().positive(),
  /** Session lifecycle status */
  status: sessionStatusSchema,
  /** When the session was paused */
  pausedAt: z.coerce.date().nullable(),
  /** When the user started the session */
  startedAt: z.coerce.date().nullable(),
  /** When the user completed the session */
  completedAt: z.coerce.date().nullable(),
  /** When the user skipped the session */
  skippedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/** Session with nested exercise completions — returned from start session */
export const userSessionWithCompletionsSchema = userSessionResponseSchema.extend({
  /** Exercise completions for this session */
  exerciseCompletions: z.array(exerciseCompletionResponseSchema),
});

/** Cascade result returned from exercise completion toggle */
export const cascadeResultSchema = z.object({
  /** Whether the parent session was auto-completed */
  sessionCompleted: z.boolean(),
  /** Whether the parent phase was auto-completed */
  phaseCompleted: z.boolean(),
  /** Whether the entire programme was auto-completed */
  programmeCompleted: z.boolean(),
});

/** Response from toggle exercise completion — includes cascade results */
export const toggleExerciseCompletionResponseSchema = z.object({
  /** Updated exercise completion */
  exerciseCompletion: exerciseCompletionResponseSchema,
  /** Cascade completion results */
  cascade: cascadeResultSchema,
});

/** Path params for PUT /sessions/{id}/complete and PUT /sessions/{id}/skip */
export const sessionParamsSchema = z.object({
  id: z.guid(),
});

/** Path params for PUT /exercises/{completionId}/complete */
export const exerciseCompletionParamsSchema = z.object({
  completionId: z.guid(),
});

/** Response from manual session complete/skip — includes cascade results */
export const sessionStatusResponseSchema = z.object({
  /** Updated session */
  session: userSessionResponseSchema,
  /** Cascade completion results */
  cascade: cascadeResultSchema,
});

/** Response from start session — session with completions */
export const startSessionResponseSchema = userSessionWithCompletionsSchema;

export type StartSessionRequest = z.infer<typeof startSessionRequestSchema>;
export type UpdateSessionStatus = z.infer<typeof updateSessionStatusSchema>;
export type ToggleExerciseCompletionRequest = z.infer<typeof toggleExerciseCompletionSchema>;
export type ExerciseCompletionResponse = z.infer<typeof exerciseCompletionResponseSchema>;
export type UserSessionResponse = z.infer<typeof userSessionResponseSchema>;
export type UserSessionWithCompletions = z.infer<typeof userSessionWithCompletionsSchema>;
export type CascadeResult = z.infer<typeof cascadeResultSchema>;
export type ToggleExerciseCompletionResponse = z.infer<
  typeof toggleExerciseCompletionResponseSchema
>;
export type SessionParams = z.infer<typeof sessionParamsSchema>;
export type ExerciseCompletionParams = z.infer<typeof exerciseCompletionParamsSchema>;
export type SessionStatusResponse = z.infer<typeof sessionStatusResponseSchema>;
export type StartSessionResponse = z.infer<typeof startSessionResponseSchema>;
