import { z } from 'zod';

import { FLOW_STEP_TYPES } from '@ffp/database/constants';

import { createPaginatedResponseSchema } from './pagination.schema';
import { publicIdSchema } from './public-id.schema';

export { TEMPLATE_LINKED_STEP_TYPES } from '@ffp/database/constants';

export const flowStepTypeSchema = z.enum(FLOW_STEP_TYPES);

export const flowStepConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  safetyNotes: z.array(z.string()).optional(),
  estimatedMinutes: z.number().positive().optional(),
});

// For descriptions, packages/database/src/constants/flow.constants.ts
export const flowStepSchema = z.object({
  publicId: publicIdSchema,
  order: z.number().int().positive('Order must be a positive integer'),
  type: flowStepTypeSchema,
  templateId: z.guid({ message: 'Invalid template ID format' }).optional(),
  config: flowStepConfigSchema,
});

export const assessmentFlowSchema = z.object({
  // UUID primary key
  id: z.guid(),
  publicId: publicIdSchema,
  // Display name (required)
  name: z.string().min(1, 'Name is required'),
  // Optional explanatory text
  description: z.string().optional(),
  // Array of flow steps (min 1)
  steps: z.array(flowStepSchema).min(1, 'At least one step is required'),
  // Whether the flow is available for use
  isActive: z.boolean(),
  // Timestamp when created
  createdAt: z.coerce.date(),
  // Timestamp when last modified
  updatedAt: z.coerce.date(),
});

/**
 * Admin create input — flow metadata only (`name`, `description`, `isActive`).
 * Steps are authored separately, not inline on create.
 */
export const createAssessmentFlowSchema = assessmentFlowSchema
  .omit({
    id: true,
    publicId: true,
    steps: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    isActive: z.boolean().optional().default(true),
  });

/**
 * Admin update input — partial flow metadata; steps are managed separately.
 * `description` is nullable so an author can clear it; omitting it leaves the
 * stored value alone.
 */
export const updateAssessmentFlowSchema = assessmentFlowSchema
  .omit({
    id: true,
    publicId: true,
    steps: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial()
  .extend({
    description: z.string().nullable().optional(),
  });

/**
 * Flow metadata as the admin surface reads it back — no steps, and `description`
 * nullable because the column is optional free text stored as NULL when unset.
 */
export const assessmentFlowMetadataSchema = assessmentFlowSchema
  .pick({
    id: true,
    publicId: true,
    name: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    description: z.string().nullable(),
  });

/** A row of the admin flow list — metadata plus the number of active steps authored on it. */
export const assessmentFlowListItemSchema = assessmentFlowMetadataSchema.extend({
  stepCount: z.number().int().nonnegative(),
});

/**
 * A step as the admin authoring surface reads it back. `templateId` is nullable
 * because the column is unset for types that carry no template;
 * `branchingRuleCount` is derived from `next_step_rules`, which are never
 * authored here.
 */
export const adminFlowStepSchema = z.object({
  publicId: publicIdSchema,
  order: z.number().int().positive(),
  type: flowStepTypeSchema,
  templateId: z.guid().nullable(),
  config: flowStepConfigSchema,
  branchingRuleCount: z.number().int().nonnegative(),
});

/** Flow metadata plus its ordered active steps. */
export const assessmentFlowWithStepsSchema = assessmentFlowMetadataSchema.extend({
  steps: z.array(adminFlowStepSchema),
});

/**
 * Filters for GET /admin/assessment-flows. Values arrive as query-string
 * strings, so `isActive` is coerced rather than declared a boolean.
 */
export const assessmentFlowListFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

/** Paginated response for GET /admin/assessment-flows. */
export const paginatedAssessmentFlowListSchema = createPaginatedResponseSchema(
  assessmentFlowListItemSchema
);

/**
 * Admin create input for a single flow step.
 *
 * Branching is read-only in the admin surface — `nextStepRules` and
 * `defaultNextStepId` are never accepted here. New steps are appended to the
 * flow (the server assigns `order`), so `order` is not part of the input.
 */
export const createFlowStepSchema = z.object({
  type: flowStepTypeSchema,
  templateId: z.guid({ message: 'Invalid template ID format' }).optional(),
  config: flowStepConfigSchema,
});

/**
 * Admin update input — partial step metadata; branching fields are never
 * authored here. `templateId` is nullable so a step moving to a type that takes
 * no template can clear the link; omitting it leaves the stored value alone.
 */
export const updateFlowStepSchema = createFlowStepSchema.partial().extend({
  templateId: z.guid({ message: 'Invalid template ID format' }).nullable().optional(),
});

/**
 * Reorder request — the flow's active step public identifiers in their desired
 * order. The server reassigns `order` to match the array position (1-based).
 */
export const reorderFlowStepsSchema = z.object({
  orderedStepPublicIds: z.array(publicIdSchema).min(1, 'At least one step is required'),
});

export type FlowStepType = z.infer<typeof flowStepTypeSchema>;
export type FlowStepConfig = z.infer<typeof flowStepConfigSchema>;
export type FlowStep = z.infer<typeof flowStepSchema>;
export type AssessmentFlow = z.infer<typeof assessmentFlowSchema>;
export type AssessmentFlowMetadata = z.infer<typeof assessmentFlowMetadataSchema>;
export type AdminFlowStepView = z.infer<typeof adminFlowStepSchema>;
export type AssessmentFlowWithStepsView = z.infer<typeof assessmentFlowWithStepsSchema>;
export type AssessmentFlowListItem = z.infer<typeof assessmentFlowListItemSchema>;
export type AssessmentFlowListFilters = z.infer<typeof assessmentFlowListFiltersSchema>;
export type PaginatedAssessmentFlowList = z.infer<typeof paginatedAssessmentFlowListSchema>;
export type CreateAssessmentFlowInput = z.infer<typeof createAssessmentFlowSchema>;
export type UpdateAssessmentFlowInput = z.infer<typeof updateAssessmentFlowSchema>;
export type CreateFlowStepInput = z.infer<typeof createFlowStepSchema>;
export type UpdateFlowStepInput = z.infer<typeof updateFlowStepSchema>;
export type ReorderFlowStepsInput = z.infer<typeof reorderFlowStepsSchema>;
