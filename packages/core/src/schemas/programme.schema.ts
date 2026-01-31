import { z } from 'zod';

import { PROGRAMME_STATUSES } from '@ffp/database/constants';

export const programmeStatusSchema = z.enum(PROGRAMME_STATUSES);

export type ProgrammeStatus = z.infer<typeof programmeStatusSchema>;

export const programmeSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.string().uuid(),
  /** Tenant ID for RLS isolation */
  tenantId: z.string().uuid(),
  /** User who owns this programme */
  userId: z.string().uuid(),
  /** Template ID used to generate this programme (from scoring config mappings) */
  programmeTemplateId: z.string().min(1),
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

export type Programme = z.infer<typeof programmeSchema>;

/**
 * Create programme schema - input for generating a new programme
 *
 * Picks required fields from programmeSchema. Omits auto-generated fields (id, status, timestamps).
 * Description is optional on creation.
 */
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

export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;
