import { z } from 'zod';

import { DIFFICULTIES } from '@ffp/database/constants';

import { createPaginatedResponseSchema, paginationInputSchema } from '../pagination.schema';
import { templatePhaseWithSessionsSchema } from '../programme-structure.schema';

// System-managed lookup table for programme templates.
export const programmeTemplateSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  /** Public identifier for URLs (nanoid, 12 chars) */
  publicId: z.string().length(12),
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
  publicId: true,
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

export type ProgrammeTemplate = z.infer<typeof programmeTemplateSchema>;
export type CreateProgrammeTemplateInput = z.infer<typeof createProgrammeTemplateSchema>;
export type UpdateProgrammeTemplateInput = z.infer<typeof updateProgrammeTemplateSchema>;
export type TemplateListQuery = z.infer<typeof templateListQuerySchema>;
export type TemplateListResponse = z.infer<typeof templateListResponseSchema>;
export type TemplateDetailResponse = z.infer<typeof templateDetailResponseSchema>;
