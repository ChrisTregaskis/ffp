import { z } from 'zod';

import { PROGRAMME_STATUSES } from '@ffp/database/constants';

// System-managed lookup table for programme templates.
export const programmeTemplateSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.string().uuid(),
  /** Unique slug for referencing in scoring config (e.g., 'gentle-mobility-programme') */
  slug: z.string().min(1).max(255),
  /** Display name (e.g., 'Gentle Mobility Programme') */
  name: z.string().min(1).max(255),
  /** Optional description of the programme template */
  description: z.string().nullable(),
  /** Whether this template is available for new programme generation */
  isActive: z.boolean(),
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
  });

export const programmeStatusSchema = z.enum(PROGRAMME_STATUSES);

// Represents a generated workout programme linked to a user and template.
export const programmeSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.string().uuid(),
  /** Tenant ID for RLS isolation */
  tenantId: z.string().uuid(),
  /** User who owns this programme */
  userId: z.string().uuid(),
  /** FK to programme_templates table */
  programmeTemplateId: z.string().uuid(),
  /** Display name for the programme */
  name: z.string().min(1).max(255),
  /** Optional description of the programme */
  description: z.string().nullable(),
  /** Programme lifecycle status */
  status: programmeStatusSchema,
  /** Timestamp when record was created */
  createdAt: z.coerce.date(),
  /** Timestamp when record was last modified */
  updatedAt: z.coerce.date(),
});

export const createProgrammeSchema = programmeSchema
  .pick({
    tenantId: true,
    userId: true,
    programmeTemplateId: true,
    name: true,
  })
  .extend({
    description: programmeSchema.shape.description.optional(),
  });

export type Programme = z.infer<typeof programmeSchema>;
export type ProgrammeTemplate = z.infer<typeof programmeTemplateSchema>;
export type CreateProgrammeTemplateInput = z.infer<typeof createProgrammeTemplateSchema>;
export type ProgrammeStatus = z.infer<typeof programmeStatusSchema>;
export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;
