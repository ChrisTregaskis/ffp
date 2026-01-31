import { z } from 'zod';

/**
 * NOTE: Questions are stored in a dedicated `questions` table and linked
 * via `template_questions`.
 */
export const assessmentTemplateSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.string().uuid(),
  /** Template name for identification and admin display */
  name: z.string().min(1).max(255),
  /** Optional description of the template purpose */
  description: z.string().nullable(),
  /** Version number for tracking template changes */
  version: z.number().int().positive(),
  /** Whether the template is currently active/usable */
  isActive: z.boolean(),
  /** User ID of the creator (nullable for system-seeded templates) */
  createdBy: z.string().uuid().nullable(),
  /** Timestamp when template was created */
  createdAt: z.date(),
  /** Timestamp when template was last updated */
  updatedAt: z.date(),
});

export const createAssessmentTemplateSchema = assessmentTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAssessmentTemplateSchema = assessmentTemplateSchema
  .omit({
    id: true,
    version: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type AssessmentTemplate = z.infer<typeof assessmentTemplateSchema>;
export type CreateAssessmentTemplateInput = z.infer<typeof createAssessmentTemplateSchema>;
export type UpdateAssessmentTemplateInput = z.infer<typeof updateAssessmentTemplateSchema>;
