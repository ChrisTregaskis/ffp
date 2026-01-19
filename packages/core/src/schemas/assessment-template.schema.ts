import { z } from 'zod';

/**
 * Assessment template schema - full template record
 *
 * Represents a complete assessment template stored in the database.
 * Templates are system-managed content (not tenant-scoped) and define
 * the structure of assessments.
 *
 * IMPORTANT: Templates do NOT require RLS - they are accessible by
 * all authenticated users as system content.
 *
 * NOTE: Questions are stored in a dedicated `questions` table and linked
 * via `template_questions`. Use the question repository to fetch questions
 * for a template.
 *
 * NOTE: Scoring configuration lives at the flow level (assessment_flows.scoringConfig),
 * not the template level. This allows holistic programme recommendations across
 * all templates in a flow.
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

export type AssessmentTemplate = z.infer<typeof assessmentTemplateSchema>;

/**
 * Create assessment template schema - input for creating new templates
 *
 * Omits auto-generated fields (id, createdAt, updatedAt).
 * Used for validation when creating templates via admin API.
 */
export const createAssessmentTemplateSchema = assessmentTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateAssessmentTemplateInput = z.infer<typeof createAssessmentTemplateSchema>;

/**
 * Update assessment template schema - input for updating existing templates
 *
 * All fields are optional to support partial updates.
 * Omits audit metadata fields that should not be modified:
 * - id: immutable identifier
 * - version: auto-incremented by repository
 * - createdBy: audit trail must remain intact
 * - createdAt/updatedAt: managed by database
 */
export const updateAssessmentTemplateSchema = assessmentTemplateSchema
  .omit({
    id: true,
    version: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type UpdateAssessmentTemplateInput = z.infer<typeof updateAssessmentTemplateSchema>;
