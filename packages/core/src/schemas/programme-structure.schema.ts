import { z } from 'zod';

/** Full template phase record — maps to the template_phases database table */
export const templatePhaseSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Public identifier for URLs (nanoid, 12 chars) */
  publicId: z.string().length(12),
  /** Parent programme template */
  programmeTemplateId: z.guid(),
  /** Ordinal position within the template (1-based) */
  phaseNumber: z.number().int().positive(),
  /** Optional display name (e.g., "Foundation Building") */
  name: z.string().max(255).nullable(),
  /** Optional phase description */
  description: z.string().nullable(),
  /** Number of sessions in this phase (1–7) */
  sessionCount: z.number().int().positive(),
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

/** Create template phase schema — admin/system use */
export const createTemplatePhaseSchema = templatePhaseSchema
  .pick({
    programmeTemplateId: true,
    phaseNumber: true,
  })
  .extend({
    name: templatePhaseSchema.shape.name.optional(),
    description: templatePhaseSchema.shape.description.optional(),
    sessionCount: templatePhaseSchema.shape.sessionCount.optional(),
  });

/** Full template session record — maps to the template_sessions database table */
export const templateSessionSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Parent template phase */
  templatePhaseId: z.guid(),
  /** Ordinal position within the phase (1-based) */
  sessionNumber: z.number().int().positive(),
  /** Optional display name (e.g., "Lower Body Focus") */
  name: z.string().max(255).nullable(),
  /** Optional session description */
  description: z.string().nullable(),
  /** Approximate session length in minutes */
  estimatedDurationMinutes: z.number().int().positive().nullable(),
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

/** Create template session schema — admin/system use */
export const createTemplateSessionSchema = templateSessionSchema
  .pick({
    templatePhaseId: true,
    sessionNumber: true,
  })
  .extend({
    name: templateSessionSchema.shape.name.optional(),
    description: templateSessionSchema.shape.description.optional(),
    estimatedDurationMinutes: templateSessionSchema.shape.estimatedDurationMinutes.optional(),
  });

/** Full session exercise record — maps to the session_exercises database table */
export const sessionExerciseSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Parent template session */
  templateSessionId: z.guid(),
  /** Exercise video from the catalogue */
  videoId: z.guid(),
  /** Display order within the session (0-based) */
  orderIndex: z.number().int().nonnegative(),
  /** Prescribed number of sets */
  sets: z.number().int().positive(),
  /** Prescribed reps — supports ranges and holds (e.g., "12", "8-12", "30s hold") */
  reps: z.string().max(20),
  /** Timed exercise duration in seconds (nullable — not all exercises are timed) */
  durationSeconds: z.number().int().positive().nullable(),
  /** Rest period between sets in seconds */
  restSeconds: z.number().int().nonnegative().nullable(),
  /** Exercise-specific instructions from the physiotherapist */
  notes: z.string().nullable(),
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

/** Create session exercise schema — admin/system use */
export const createSessionExerciseSchema = sessionExerciseSchema
  .pick({
    templateSessionId: true,
    videoId: true,
    orderIndex: true,
  })
  .extend({
    sets: sessionExerciseSchema.shape.sets.optional(),
    reps: sessionExerciseSchema.shape.reps.optional(),
    durationSeconds: sessionExerciseSchema.shape.durationSeconds.optional(),
    restSeconds: sessionExerciseSchema.shape.restSeconds.optional(),
    notes: sessionExerciseSchema.shape.notes.optional(),
  });

// ---------- Nested Response Schemas ----------

/** Template phase with nested sessions and exercises — for full template hierarchy responses */
export const templatePhaseWithSessionsSchema = templatePhaseSchema
  .pick({
    id: true,
    publicId: true,
    phaseNumber: true,
    name: true,
    description: true,
    sessionCount: true,
  })
  .extend({
    sessions: z.array(
      templateSessionSchema
        .pick({
          id: true,
          sessionNumber: true,
          name: true,
          estimatedDurationMinutes: true,
        })
        .extend({
          exercises: z.array(
            sessionExerciseSchema.pick({
              id: true,
              videoId: true,
              orderIndex: true,
              sets: true,
              reps: true,
              durationSeconds: true,
              restSeconds: true,
              notes: true,
            })
          ),
        })
    ),
  });

export type TemplatePhase = z.infer<typeof templatePhaseSchema>;
export type CreateTemplatePhaseInput = z.infer<typeof createTemplatePhaseSchema>;
export type TemplateSession = z.infer<typeof templateSessionSchema>;
export type CreateTemplateSessionInput = z.infer<typeof createTemplateSessionSchema>;
export type SessionExercise = z.infer<typeof sessionExerciseSchema>;
export type CreateSessionExerciseInput = z.infer<typeof createSessionExerciseSchema>;
export type TemplatePhaseWithSessions = z.infer<typeof templatePhaseWithSessionsSchema>;
