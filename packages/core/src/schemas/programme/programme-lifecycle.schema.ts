import { z } from 'zod';

import { PROGRAMME_STATUSES, PHASE_STATUSES } from '@ffp/database/constants';

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

export type Programme = z.infer<typeof programmeSchema>;
export type ActiveProgrammeResponse = z.infer<typeof activeProgrammeResponseSchema>;
export type ReplaceProgrammeRequest = z.infer<typeof replaceProgrammeRequestSchema>;
export type ReplaceProgrammeResponse = z.infer<typeof replaceProgrammeResponseSchema>;
export type ProgrammeStatus = z.infer<typeof programmeStatusSchema>;
export type PhaseStatus = z.infer<typeof phaseStatusSchema>;
export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;
export type ProgrammePhase = z.infer<typeof programmePhaseSchema>;
export type CreateProgrammePhaseInput = z.infer<typeof createProgrammePhaseSchema>;
