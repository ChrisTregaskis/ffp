import { z } from 'zod';

import {
  questionOptionSchema,
  questionTypeSchema,
  questionValidationSchema,
  scoreDimensionSchema,
  type AssessmentQuestion,
} from './assessment-question.schema';
import { booleanQueryParamSchema, createPaginatedResponseSchema } from './pagination.schema';
import { publicIdSchema } from './public-id.schema';
import { resolveEffectiveValidation } from './question-answer.schema';

/**
 * NOTE: Questions are stored in a dedicated `questions` table and linked
 * via `template_questions`.
 */
export const assessmentTemplateSchema = z.object({
  /** Unique identifier (UUID) */
  id: z.guid(),
  publicId: publicIdSchema,
  /** Template name for identification and admin display */
  name: z.string().min(1).max(255),
  /** Optional description of the template purpose */
  description: z.string().nullable(),
  /** Version number for tracking template changes */
  version: z.number().int().positive(),
  /** Whether the template is currently active/usable */
  isActive: z.boolean(),
  /** User ID of the creator (nullable for system-seeded templates) */
  createdBy: z.guid().nullable(),
  /** Timestamp when template was created */
  createdAt: z.coerce.date(),
  /** Timestamp when template was last updated */
  updatedAt: z.coerce.date(),
});

export const createAssessmentTemplateSchema = assessmentTemplateSchema
  .omit({
    id: true,
    publicId: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    description: z.string().nullable().optional(),
    version: z.number().int().positive().optional().default(1),
    isActive: z.boolean().optional().default(true),
  });

export const updateAssessmentTemplateSchema = assessmentTemplateSchema
  .omit({
    id: true,
    publicId: true,
    version: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

/** A row of the admin template list — the template plus how much it holds and where it is used. */
export const assessmentTemplateListItemSchema = assessmentTemplateSchema.extend({
  /** Questions assigned to the template */
  questionCount: z.number().int().nonnegative(),
  /** Flows with an active step linking the template */
  flowCount: z.number().int().nonnegative(),
});

/**
 * Filters for GET /admin/assessment-templates. Values arrive as query-string
 * strings, so `isActive` is coerced rather than declared a boolean.
 */
export const assessmentTemplateListFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: booleanQueryParamSchema.optional(),
});

/** Paginated response for GET /admin/assessment-templates. */
export const paginatedAssessmentTemplateListSchema = createPaginatedResponseSchema(
  assessmentTemplateListItemSchema
);

/**
 * Raw question shape as returned by the backend (QuestionWithConfig). The
 * member read transforms it into an AssessmentQuestion; the admin read keeps
 * it as stored, because authoring needs the slug, status and display order.
 */
export const templateQuestionResponseSchema = z.object({
  /** Question UUID */
  id: z.guid(),
  publicId: publicIdSchema,
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
  videoId: z.guid().nullable(),
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
  // A deactivated question still assigned is left out, as the server leaves it out
  templateQuestions: z.array(templateQuestionResponseSchema).transform((questions) =>
    questions
      .filter((q) => q.isActive)
      .map(
        (q): AssessmentQuestion => ({
          id: q.id,
          publicId: q.publicId,
          type: q.type,
          question: q.configOverrides?.questionText ?? q.questionText,
          description: q.configOverrides?.description ?? q.description ?? undefined,
          options: q.options ?? undefined,
          validation: resolveEffectiveValidation(q) ?? undefined,
          videoId: q.videoId ?? undefined,
          scoreDimension: q.scoreDimension ?? undefined,
        })
      )
  ),
});

/** A flow whose active steps link the template — what recomposing it reaches. */
export const templateFlowUsageSchema = z.object({
  publicId: publicIdSchema,
  name: z.string(),
  isActive: z.boolean(),
});

/** The admin read of one template: the row, its questions as stored, and the flows using it. */
export const adminAssessmentTemplateDetailSchema = assessmentTemplateSchema.extend({
  templateQuestions: z.array(templateQuestionResponseSchema),
  flows: z.array(templateFlowUsageSchema),
});

/**
 * Bulk-assign questions to a template. Assignments are appended in the order
 * supplied. The upper bound keeps a single request from resolving and inserting
 * an unbounded set inside one transaction.
 */
export const assignQuestionsSchema = z.object({
  questionPublicIds: z
    .array(publicIdSchema)
    .min(1, 'At least one question is required')
    .max(50, 'At most 50 questions can be assigned in one request'),
});

/** Reorder a template's assigned questions. Must list every currently assigned question exactly once. */
export const reorderTemplateQuestionsSchema = z.object({
  orderedQuestionPublicIds: z.array(publicIdSchema).min(1, 'At least one question is required'),
});

export type AssessmentTemplate = z.infer<typeof assessmentTemplateSchema>;
export type CreateAssessmentTemplateInput = z.infer<typeof createAssessmentTemplateSchema>;
/** What a caller sends to create a template: the creator comes from the actor, the rest may default. */
export type CreateAssessmentTemplateRequest = Omit<
  z.input<typeof createAssessmentTemplateSchema>,
  'createdBy'
>;
export type AssessmentTemplateListItem = z.infer<typeof assessmentTemplateListItemSchema>;
export type AssessmentTemplateListFilters = z.infer<typeof assessmentTemplateListFiltersSchema>;
export type PaginatedAssessmentTemplateList = z.infer<typeof paginatedAssessmentTemplateListSchema>;
export type TemplateQuestionResponse = z.infer<typeof templateQuestionResponseSchema>;
export type TemplateFlowUsage = z.infer<typeof templateFlowUsageSchema>;
export type AdminAssessmentTemplateDetail = z.infer<typeof adminAssessmentTemplateDetailSchema>;
export type UpdateAssessmentTemplateInput = z.infer<typeof updateAssessmentTemplateSchema>;
export type AssessmentTemplateWithQuestions = z.infer<typeof assessmentTemplateWithQuestionsSchema>;
export type AssignQuestionsInput = z.infer<typeof assignQuestionsSchema>;
export type ReorderTemplateQuestionsInput = z.infer<typeof reorderTemplateQuestionsSchema>;
