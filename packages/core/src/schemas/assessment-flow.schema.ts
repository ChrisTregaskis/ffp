import { z } from 'zod';

import { FLOW_STEP_TYPES } from '@ffp/database/constants';

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
  // Public identifier for URLs (nanoid, 12 chars)
  publicId: z.string().length(12),
  order: z.number().int().positive('Order must be a positive integer'),
  type: flowStepTypeSchema,
  templateId: z.guid({ message: 'Invalid template ID format' }).optional(),
  config: flowStepConfigSchema,
});

export const assessmentFlowSchema = z.object({
  // UUID primary key
  id: z.guid(),
  // Public identifier for URLs (nanoid, 12 chars)
  publicId: z.string().length(12),
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

/** Admin update input — partial flow metadata; steps are managed separately. */
export const updateAssessmentFlowSchema = assessmentFlowSchema
  .omit({
    id: true,
    publicId: true,
    steps: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type FlowStepType = z.infer<typeof flowStepTypeSchema>;
export type FlowStepConfig = z.infer<typeof flowStepConfigSchema>;
export type FlowStep = z.infer<typeof flowStepSchema>;
export type AssessmentFlow = z.infer<typeof assessmentFlowSchema>;
export type CreateAssessmentFlowInput = z.infer<typeof createAssessmentFlowSchema>;
export type UpdateAssessmentFlowInput = z.infer<typeof updateAssessmentFlowSchema>;
