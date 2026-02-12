import { z } from 'zod';

import {
  questionOptionSchema,
  questionTypeSchema,
  questionValidationSchema,
  scoreDimensionSchema,
  type AssessmentQuestion,
} from './assessment-question.schema';

/**
 * NOTE: Questions are stored in a dedicated `questions` table and linked
 * via `template_questions`.
 */
export const assessmentTemplateSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.string(), // Relaxed from .uuid() — see FFP-279
  /** Template name for identification and admin display */
  name: z.string().min(1).max(255),
  /** Optional description of the template purpose */
  description: z.string().nullable(),
  /** Version number for tracking template changes */
  version: z.number().int().positive(),
  /** Whether the template is currently active/usable */
  isActive: z.boolean(),
  /** User ID of the creator (nullable for system-seeded templates) */
  createdBy: z.string().nullable(), // Relaxed from .uuid() — see FFP-279
  /** Timestamp when template was created */
  createdAt: z.coerce.date(),
  /** Timestamp when template was last updated */
  updatedAt: z.coerce.date(),
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

/**
 * Raw question shape as returned by the backend (QuestionWithConfig).
 *
 * Used internally for parsing the API response before transforming
 * to the frontend AssessmentQuestion shape.
 */
const templateQuestionResponseSchema = z.object({
  /** Question UUID */
  id: z.string(), // Relaxed from .uuid() — see FFP-279
  /** URL-friendly identifier (backend-only, stripped in transform) */
  slug: z.string(),
  /** Question type (determines UI component) */
  type: questionTypeSchema,
  /** Question text as stored in the database */
  questionText: z.string().min(1),
  /** Optional helper text */
  description: z.string().nullable(),
  /** Choice options for single/multi-choice questions */
  options: z.array(questionOptionSchema).nullable(),
  /** Validation rules */
  validation: questionValidationSchema.nullable(),
  /** Video reference for video-response questions */
  videoId: z.string().nullable(), // Relaxed from .uuid() — see FFP-279
  /** Scoring dimension this question contributes to */
  scoreDimension: scoreDimensionSchema.nullable(),
  /** Whether the question is active (backend-only, stripped in transform) */
  isActive: z.boolean(),
  /** Display order within the template (backend-only, stripped in transform) */
  displayOrder: z.number().int(),
  /** Template-specific configuration overrides (applied then stripped in transform) */
  configOverrides: z
    .object({
      questionText: z.string().optional(),
      description: z.string().optional(),
      validation: questionValidationSchema.optional(),
    })
    .nullable(),
});

/**
 * Assessment template with questions — extends the base template
 * with a transformed templateQuestions array.
 *
 * Maps backend QuestionWithConfig to frontend AssessmentQuestion:
 * - questionText -> question (with configOverrides applied)
 * - Nullable fields -> optional fields
 * - Backend-only fields stripped (slug, isActive, displayOrder, configOverrides)
 */
export const assessmentTemplateWithQuestionsSchema = assessmentTemplateSchema.extend({
  templateQuestions: z.array(templateQuestionResponseSchema).transform((questions) =>
    questions.map(
      (q): AssessmentQuestion => ({
        id: q.id,
        type: q.type,
        question: q.configOverrides?.questionText ?? q.questionText,
        description: q.configOverrides?.description ?? q.description ?? undefined,
        options: q.options ?? undefined,
        validation: q.configOverrides?.validation ?? q.validation ?? undefined,
        videoId: q.videoId ?? undefined,
        scoreDimension: q.scoreDimension ?? undefined,
      })
    )
  ),
});

export type AssessmentTemplate = z.infer<typeof assessmentTemplateSchema>;
export type CreateAssessmentTemplateInput = z.infer<typeof createAssessmentTemplateSchema>;
export type UpdateAssessmentTemplateInput = z.infer<typeof updateAssessmentTemplateSchema>;
export type AssessmentTemplateWithQuestions = z.infer<typeof assessmentTemplateWithQuestionsSchema>;
