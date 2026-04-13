import { z } from 'zod';

import {
  sessionExerciseSchema,
  templatePhaseSchema,
  templateSessionSchema,
} from '../programme-structure.schema';

/** Create phase request body — name and description optional, phaseNumber auto-assigned */
export const createPhaseRequestSchema = z.object({
  name: templatePhaseSchema.shape.name.optional(),
  description: templatePhaseSchema.shape.description.optional(),
});

/** Update phase request body — all fields optional (partial update) */
export const updatePhaseRequestSchema = z
  .object({
    name: templatePhaseSchema.shape.name,
    description: templatePhaseSchema.shape.description,
  })
  .partial();

/** Reorder phases request body — ordered array of phase IDs */
export const reorderPhasesRequestSchema = z.object({
  orderedIds: z.array(z.guid()).min(1),
});

/** Phase response — full phase record for API responses */
export const phaseResponseSchema = templatePhaseSchema.pick({
  id: true,
  programmeTemplateId: true,
  phaseNumber: true,
  name: true,
  description: true,
  sessionCount: true,
  createdAt: true,
  updatedAt: true,
});

/** Create session request body — all fields optional, sessionNumber auto-assigned */
export const createSessionRequestSchema = z.object({
  name: templateSessionSchema.shape.name.optional(),
  description: templateSessionSchema.shape.description.optional(),
  estimatedDurationMinutes: templateSessionSchema.shape.estimatedDurationMinutes.optional(),
});

/** Update session request body — all fields optional (partial update) */
export const updateSessionRequestSchema = z
  .object({
    name: templateSessionSchema.shape.name,
    description: templateSessionSchema.shape.description,
    estimatedDurationMinutes: templateSessionSchema.shape.estimatedDurationMinutes,
  })
  .partial();

/** Reorder sessions request body — ordered array of session IDs */
export const reorderSessionsRequestSchema = z.object({
  orderedIds: z.array(z.guid()).min(1),
});

/** Session response — full session record for API responses */
export const sessionResponseSchema = templateSessionSchema.pick({
  id: true,
  templatePhaseId: true,
  sessionNumber: true,
  name: true,
  description: true,
  estimatedDurationMinutes: true,
  createdAt: true,
  updatedAt: true,
});

/** Create exercise request body — videoId required, prescription fields optional (pre-populated from video defaults) */
export const createExerciseRequestSchema = z.object({
  videoId: z.guid(),
  sets: sessionExerciseSchema.shape.sets.optional(),
  reps: sessionExerciseSchema.shape.reps.optional(),
  durationSeconds: sessionExerciseSchema.shape.durationSeconds.optional(),
  restSeconds: sessionExerciseSchema.shape.restSeconds.optional(),
  notes: sessionExerciseSchema.shape.notes.optional(),
});

/** Update exercise request body — all fields optional (partial update), at least one required */
export const updateExerciseRequestSchema = z
  .object({
    videoId: z.guid(),
    sets: sessionExerciseSchema.shape.sets,
    reps: sessionExerciseSchema.shape.reps,
    durationSeconds: sessionExerciseSchema.shape.durationSeconds,
    restSeconds: sessionExerciseSchema.shape.restSeconds,
    notes: sessionExerciseSchema.shape.notes,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/** Reorder exercises request body — ordered array of exercise IDs */
export const reorderExercisesRequestSchema = z.object({
  orderedIds: z.array(z.guid()).min(1),
});

/** Video summary embedded in exercise responses — lightweight video metadata for display */
export const exerciseVideoSummarySchema = z.object({
  id: z.guid(),
  title: z.string(),
  status: z.string(),
});

/** Exercise response — exercise fields with embedded video summary */
export const exerciseResponseSchema = sessionExerciseSchema
  .pick({
    id: true,
    templateSessionId: true,
    videoId: true,
    orderIndex: true,
    sets: true,
    reps: true,
    durationSeconds: true,
    restSeconds: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    video: exerciseVideoSummarySchema,
  });

export type CreatePhaseRequest = z.infer<typeof createPhaseRequestSchema>;
export type UpdatePhaseRequest = z.infer<typeof updatePhaseRequestSchema>;
export type ReorderPhasesRequest = z.infer<typeof reorderPhasesRequestSchema>;
export type PhaseResponse = z.infer<typeof phaseResponseSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type UpdateSessionRequest = z.infer<typeof updateSessionRequestSchema>;
export type ReorderSessionsRequest = z.infer<typeof reorderSessionsRequestSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type CreateExerciseRequest = z.infer<typeof createExerciseRequestSchema>;
export type UpdateExerciseRequest = z.infer<typeof updateExerciseRequestSchema>;
export type ReorderExercisesRequest = z.infer<typeof reorderExercisesRequestSchema>;
export type ExerciseResponse = z.infer<typeof exerciseResponseSchema>;
export type ExerciseVideoSummary = z.infer<typeof exerciseVideoSummarySchema>;
