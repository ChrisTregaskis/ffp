import { z } from 'zod';

import { PHASE_STATUSES, SESSION_STATUSES, DIFFICULTIES } from '@ffp/database/constants';

import { programmeStatusSchema } from './programme-lifecycle.schema';

/** Video metadata embedded in exercise detail */
const detailVideoSchema = z.object({
  id: z.guid(),
  title: z.string(),
  thumbnailKey: z.string().nullable(),
  durationSeconds: z.number().int().positive(),
  difficulty: z.string().nullable(),
});

/** Exercise completion status (user-layer, only for current/completed phases) */
const detailCompletionSchema = z.object({
  id: z.guid(),
  completed: z.boolean(),
  completedAt: z.coerce.date().nullable(),
  skipped: z.boolean(),
});

/** Full exercise detail (only for current/completed phases) */
const detailExerciseSchema = z.object({
  sessionExerciseId: z.guid(),
  orderIndex: z.number().int().nonnegative(),
  sets: z.number().int().positive(),
  reps: z.string(),
  durationSeconds: z.number().int().positive().nullable(),
  restSeconds: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable(),
  video: detailVideoSchema,
  completion: detailCompletionSchema.nullable(),
});

/** User session status (user-layer, only for current/completed phases) */
const detailUserSessionSchema = z.object({
  id: z.guid(),
  status: z.enum(SESSION_STATUSES),
  startedAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  skippedAt: z.coerce.date().nullable(),
});

/** Session within a phase — tiered: full detail or summary only */
const detailSessionSchema = z.object({
  templateSessionId: z.guid(),
  templateSessionPublicId: z.string().length(12),
  sessionNumber: z.number().int().positive(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  estimatedDurationMinutes: z.number().int().positive().nullable(),
  exerciseCount: z.number().int().nonnegative(),
  /** Only present for current/completed phases */
  userSession: detailUserSessionSchema.nullable().optional(),
  /** Only present for current/completed phases */
  exercises: z.array(detailExerciseSchema).optional(),
});

/** Phase with sessions — tiered visibility applied */
const detailPhaseSchema = z.object({
  id: z.guid(),
  publicId: z.string().length(12),
  phaseNumber: z.number().int().positive(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  status: z.enum(PHASE_STATUSES),
  sessions: z.array(detailSessionSchema),
});

/** Template summary embedded in programme detail */
const detailTemplateSchema = z.object({
  name: z.string(),
  difficulty: z.enum(DIFFICULTIES),
});

/** Programme metadata in detail response */
const detailProgrammeSchema = z.object({
  id: z.guid(),
  name: z.string(),
  description: z.string().nullable(),
  status: programmeStatusSchema,
  startedAt: z.coerce.date().nullable(),
  totalPhases: z.number().int().nonnegative().nullable(),
  template: detailTemplateSchema,
});

/** Full programme detail response with tiered phase visibility */
export const programmeDetailResponseSchema = z.object({
  programme: detailProgrammeSchema,
  currentPhaseNumber: z.number().int().positive().nullable(),
  phases: z.array(detailPhaseSchema),
});

export type ProgrammeDetailResponse = z.infer<typeof programmeDetailResponseSchema>;
