import { z } from 'zod';

import { QUESTION_TYPES } from '@ffp/database/constants';

export const questionTypeSchema = z.enum(QUESTION_TYPES);

export const questionOptionSchema = z.object({
  /** Unique value identifier for this option */
  value: z.string().min(1),
  /** Display label shown to the user */
  label: z.string().min(1),
  /** Optional score value for scoring calculations */
  score: z.number().optional(),
});

export const questionValidationSchema = z.object({
  /** Whether an answer is required (defaults to true) */
  required: z.boolean().default(true),
  /** Minimum value (numeric/scale) or minimum length (text) */
  min: z.number().optional(),
  /** Maximum value (numeric/scale) or maximum length (text) */
  max: z.number().optional(),
  /** Maximum number of options a user may select (multi-choice only) */
  maxSelections: z.number().int().positive().optional(),
  /** Regex pattern for text validation */
  pattern: z.string().optional(),
  /** Custom error message for validation failures */
  customError: z.string().optional(),
});

/**
 * Score dimension enumeration - defines the scoring dimensions for assessments
 *
 * Questions can contribute to different scoring dimensions:
 * - strength: Physical strength assessments
 * - balance: Balance and stability assessments
 * - mobility: Range of motion and flexibility
 * - pain: Pain level and discomfort tracking
 * - general: General fitness or non-categorised scoring
 */
export const scoreDimensionSchema = z.enum(['strength', 'balance', 'mobility', 'pain', 'general']);

export const assessmentQuestionSchema = z
  .object({
    /** Unique identifier for the question (UUID) */
    id: z.guid(),
    /** Public identifier for URLs (nanoid, 12 chars) */
    publicId: z.string().length(12),
    /** Type of question (determines UI component and validation) */
    type: questionTypeSchema,
    /** The question text displayed to the user */
    question: z.string().min(1),
    /** Optional description or helper text */
    description: z.string().optional(),
    /** Selectable options (required for single-choice and multi-choice) */
    options: z.array(questionOptionSchema).optional(),
    /** Validation rules for the question response */
    validation: questionValidationSchema.optional(),
    /** Video ID for video-response questions (references videos table) */
    videoId: z.guid().optional(),
    /** Scoring dimension this question contributes to */
    scoreDimension: scoreDimensionSchema.optional(),
  })
  .refine(
    (data) => {
      // Require videoId when question type is video-response
      if (data.type === 'video-response') {
        return !!data.videoId;
      }

      return true;
    },
    {
      message: 'videoId is required for video-response question type',
      path: ['videoId'],
    }
  )
  .refine(
    (data) => {
      // Require at least 2 options for choice-based question types
      if (data.type === 'single-choice' || data.type === 'multi-choice') {
        return data.options && data.options.length >= 2;
      }

      return true;
    },
    {
      message: 'At least 2 options are required for choice-based question types',
      path: ['options'],
    }
  );

export const questionsArraySchema = z
  .array(assessmentQuestionSchema)
  .min(1, 'At least one question is required');

/** Kebab-case slug, capped to the `questions.slug` column (varchar 100). */
const questionSlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be 100 characters or fewer')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be kebab-case (lowercase letters, digits and single hyphens)'
  );

/**
 * Admin write shape. Uses DB-aligned field names (`questionText`, not the
 * member-facing `question` alias on the read schema).
 */
const questionWriteBaseSchema = z.object({
  slug: questionSlugSchema,
  type: questionTypeSchema,
  questionText: z.string().min(1, 'Question text is required'),
  description: z.string().optional(),
  options: z.array(questionOptionSchema).optional(),
  validation: questionValidationSchema.optional(),
  videoId: z.guid().optional(),
  scoreDimension: scoreDimensionSchema.optional(),
  // No default here — `.partial()` keeps field defaults, so a default would let
  // a partial update omitting `isActive` silently reactivate a soft-deleted
  // question. Create applies the default instead.
  isActive: z.boolean().optional(),
});

/**
 * Per-type shape rules shared by create and update. Each check only fires when
 * its fields are present, so it is safe on a partial (update) shape.
 */
function refineQuestionShape(
  data: {
    type?: QuestionType;
    options?: QuestionOption[];
    validation?: QuestionValidation;
    videoId?: string;
  },
  ctx: z.RefinementCtx
): void {
  const { type, options, validation } = data;

  // Choice types require at least two options
  if (type === 'single-choice' || type === 'multi-choice') {
    if (!options || options.length < 2) {
      ctx.addIssue({
        code: 'custom',
        message: 'At least 2 options are required for choice-based question types',
        path: ['options'],
      });
    }
  }

  // maxSelections is a multi-choice cap only, and cannot exceed the option count
  if (validation?.maxSelections !== undefined) {
    if (type !== 'multi-choice') {
      ctx.addIssue({
        code: 'custom',
        message: 'maxSelections is only valid for multi-choice questions',
        path: ['validation', 'maxSelections'],
      });
    } else if (options && validation.maxSelections > options.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'maxSelections cannot exceed the number of options',
        path: ['validation', 'maxSelections'],
      });
    }
  }

  // min must not exceed max wherever both bounds are supplied (numeric/scale
  // value bounds, text length bounds). video-response rejects min/max outright
  // below, so it is excluded here to avoid a duplicate issue.
  if (
    type !== 'video-response' &&
    validation?.min !== undefined &&
    validation.max !== undefined &&
    validation.min > validation.max
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'min cannot be greater than max',
      path: ['validation', 'min'],
    });
  }

  // video-response is completion-only: videoId required, no scoring range
  if (type === 'video-response') {
    if (!data.videoId) {
      ctx.addIssue({
        code: 'custom',
        message: 'videoId is required for video-response question type',
        path: ['videoId'],
      });
    }

    if (validation?.min !== undefined || validation?.max !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message:
          'video-response questions are completion-only and cannot define a scoring range (min/max)',
        path: ['validation'],
      });
    }
  }
}

/** Create input — `isActive` defaults to true here (not on the shared base; see above). */
export const createQuestionSchema = questionWriteBaseSchema
  .extend({ isActive: z.boolean().optional().default(true) })
  .superRefine(refineQuestionShape);

/** Partial update; `slug` is immutable so it is omitted from the input. */
export const updateQuestionSchema = questionWriteBaseSchema
  .omit({ slug: true })
  .partial()
  .superRefine(refineQuestionShape);

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type QuestionValidation = z.infer<typeof questionValidationSchema>;
export type ScoreDimension = z.infer<typeof scoreDimensionSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type QuestionsArray = z.infer<typeof questionsArraySchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
