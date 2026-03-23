import { z } from 'zod';

import { PROGRAMME_STATUSES, PHASE_STATUSES, DIFFICULTIES } from '@ffp/database/constants';

import { createPaginatedResponseSchema, paginationInputSchema } from './pagination.schema';
import {
  sessionExerciseSchema,
  templatePhaseSchema,
  templateSessionSchema,
  templatePhaseWithSessionsSchema,
} from './programme-structure.schema';

// System-managed lookup table for programme templates.
export const programmeTemplateSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Unique slug for referencing in scoring config (e.g., 'gentle-mobility-programme') */
  slug: z.string().min(1).max(255),
  /** Display name (e.g., 'Gentle Mobility Programme') */
  name: z.string().min(1).max(255),
  /** Optional description of the programme template */
  description: z.string().nullable(),
  /** Whether this template is available for new programme generation */
  isActive: z.boolean(),
  /** Total number of phases — auto-computed from actual phase count */
  totalPhases: z.number().int().nonnegative(),
  /** Programme difficulty level (shared enum with videos) */
  difficulty: z.enum(DIFFICULTIES),
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

/** Create programme template schema - picks from programmeTemplateSchema */
export const createProgrammeTemplateSchema = programmeTemplateSchema
  .pick({
    slug: true,
    name: true,
  })
  .extend({
    description: programmeTemplateSchema.shape.description.optional(),
    isActive: programmeTemplateSchema.shape.isActive.optional(),
    difficulty: programmeTemplateSchema.shape.difficulty.optional(),
  });

/** Update programme template — all fields optional (partial update) */
export const updateProgrammeTemplateSchema = programmeTemplateSchema
  .pick({
    slug: true,
    name: true,
  })
  .extend({
    description: programmeTemplateSchema.shape.description,
    isActive: programmeTemplateSchema.shape.isActive,
    difficulty: programmeTemplateSchema.shape.difficulty,
  })
  .partial();

/** Query parameters for GET /admin/programme-templates — pagination + filters */
export const templateListQuerySchema = paginationInputSchema.extend({
  /** Free-text search across name and slug */
  search: z.string().optional(),
  /** Filter by difficulty level */
  difficulty: z.enum(DIFFICULTIES).optional(),
  /** Filter by active status (coerced from query string) */
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
});

/** Response schema for template list items — lightweight metadata for browsing */
export const templateListResponseSchema = programmeTemplateSchema.pick({
  id: true,
  slug: true,
  name: true,
  difficulty: true,
  totalPhases: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

/** Response schema for template detail — full template with nested hierarchy */
export const templateDetailResponseSchema = programmeTemplateSchema.extend({
  /** Nested phases → sessions → exercises */
  phases: z.array(templatePhaseWithSessionsSchema),
});

/** Paginated response schema for GET /admin/programme-templates */
export const paginatedTemplateListResponseSchema = createPaginatedResponseSchema(
  templateListResponseSchema
);

export const programmeStatusSchema = z.enum(PROGRAMME_STATUSES);
export const phaseStatusSchema = z.enum(PHASE_STATUSES);

// Represents a generated workout programme linked to a user and template.
export const programmeSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Organisation ID for RLS isolation */
  organisationId: z.guid(),
  /** User who owns this programme */
  userId: z.guid(),
  /** FK to programme_templates table */
  programmeTemplateId: z.guid(),
  /** Display name for the programme */
  name: z.string().min(1).max(255),
  /** Optional description of the programme */
  description: z.string().nullable(),
  /** Programme lifecycle status */
  status: programmeStatusSchema,
  /** When the user first started a session */
  startedAt: z.coerce.date().nullable(),
  /** When all phases/sessions were completed */
  completedAt: z.coerce.date().nullable(),
  /** When the programme was archived */
  archivedAt: z.coerce.date().nullable(),
  /** Why archived: reassessment, manual, expired */
  archivedReason: z.string().max(50).nullable(),
  /** Successor programme (self-referential linked list) */
  replacedByProgrammeId: z.guid().nullable(),
  /** Snapshot of template's total phases at assignment time */
  totalPhases: z.number().int().nonnegative().nullable(),
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

export const createProgrammeSchema = programmeSchema
  .pick({
    organisationId: true,
    userId: true,
    programmeTemplateId: true,
    name: true,
  })
  .extend({
    description: programmeSchema.shape.description.optional(),
    totalPhases: programmeSchema.shape.totalPhases.optional(),
  });

/** Response schema for the active programme endpoint */
export const activeProgrammeResponseSchema = programmeSchema.pick({
  id: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
});

/** Request schema for the replace programme endpoint */
export const replaceProgrammeRequestSchema = z.object({
  /** The completed reassessment ID whose recommendation should replace the active programme */
  assessmentId: z.guid({ message: 'assessmentId must be a valid GUID' }),
});

/** Response schema for the replace programme endpoint */
export const replaceProgrammeResponseSchema = z.object({
  /** New programme UUID */
  programmeId: z.string(),
  /** New programme display name */
  programmeName: z.string(),
});

// User-layer phase instance — created eagerly at programme assignment time.
export const programmePhaseSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Organisation ID for RLS isolation */
  organisationId: z.guid(),
  /** Parent programme */
  programmeId: z.guid(),
  /** Source template phase */
  templatePhaseId: z.guid(),
  /** Ordinal position copied from template (1-based) */
  phaseNumber: z.number().int().positive(),
  /** Display name copied from template phase */
  name: z.string().max(255).nullable(),
  /** Phase completion status */
  status: phaseStatusSchema,
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

/** Create programme phase schema — used internally by generateProgramme service */
export const createProgrammePhaseSchema = programmePhaseSchema.pick({
  organisationId: true,
  programmeId: true,
  templatePhaseId: true,
  phaseNumber: true,
  name: true,
});

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
  thumbnailKey: z.string().nullable(),
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

export type Programme = z.infer<typeof programmeSchema>;
export type ActiveProgrammeResponse = z.infer<typeof activeProgrammeResponseSchema>;
export type ReplaceProgrammeRequest = z.infer<typeof replaceProgrammeRequestSchema>;
export type ReplaceProgrammeResponse = z.infer<typeof replaceProgrammeResponseSchema>;
export type ProgrammeTemplate = z.infer<typeof programmeTemplateSchema>;
export type CreateProgrammeTemplateInput = z.infer<typeof createProgrammeTemplateSchema>;
export type UpdateProgrammeTemplateInput = z.infer<typeof updateProgrammeTemplateSchema>;
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>;
export type TemplateListResponse = z.infer<typeof templateListResponseSchema>;
export type TemplateDetailResponse = z.infer<typeof templateDetailResponseSchema>;
export type ProgrammeStatus = z.infer<typeof programmeStatusSchema>;
export type PhaseStatus = z.infer<typeof phaseStatusSchema>;
export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;
export type ProgrammePhase = z.infer<typeof programmePhaseSchema>;
export type CreateProgrammePhaseInput = z.infer<typeof createProgrammePhaseSchema>;
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
