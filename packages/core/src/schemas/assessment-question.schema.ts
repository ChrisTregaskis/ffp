import { z } from 'zod';

import { QUESTION_TYPES, SCORE_DIMENSIONS } from '@ffp/database/constants';

import { publicIdSchema } from './public-id.schema';

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

/** The scoring dimension a question contributes to (values from `SCORE_DIMENSIONS`) */
export const scoreDimensionSchema = z.enum(SCORE_DIMENSIONS);

export const assessmentQuestionSchema = z
  .object({
    /** Unique identifier for the question (UUID) */
    id: z.guid(),
    publicId: publicIdSchema,
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
    options?: QuestionOption[] | null;
    validation?: QuestionValidation | null;
    videoId?: string | null;
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

  // min must not exceed max wherever both bounds are supplied — numeric/scale
  // value bounds, text length bounds, video-response duration bounds.
  if (
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

  // video-response needs a video. It may also carry a min/max duration, which
  // the member-facing renderer uses as the bounds of the result input.
  if (type === 'video-response' && !data.videoId) {
    ctx.addIssue({
      code: 'custom',
      message: 'videoId is required for video-response question type',
      path: ['videoId'],
    });
  }
}

/** Create input — `isActive` defaults to true here (not on the shared base; see above). */
export const createQuestionSchema = questionWriteBaseSchema
  .extend({ isActive: z.boolean().optional().default(true) })
  .superRefine(refineQuestionShape);

/**
 * Partial update; `slug` is immutable. The nullable fields clear on an explicit
 * `null`. Per-type rules live on `questionShapeSchema` — a partial cannot see
 * the fields it did not resend, so checking it alone both misses breaches and
 * invents them.
 */
export const updateQuestionSchema = questionWriteBaseSchema
  .omit({ slug: true })
  .extend({
    description: z.string().nullable(),
    videoId: z.guid().nullable(),
    scoreDimension: scoreDimensionSchema.nullable(),
    // `.partial()` does not reach inside `validation`, so the `required` default
    // would be forced true by any update touching it. Same trap as `isActive`.
    validation: questionValidationSchema.extend({ required: z.boolean().optional() }),
  })
  .partial();

/**
 * The per-type rules over a whole question. Create applies them inline; update
 * applies them to the merged row. Nullable because a stored row carries `null`.
 */
export const questionShapeSchema = z
  .object({
    type: questionTypeSchema,
    options: z.array(questionOptionSchema).nullable().optional(),
    validation: questionValidationSchema.nullable().optional(),
    videoId: z.guid().nullable().optional(),
  })
  .superRefine(refineQuestionShape);

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type QuestionValidation = z.infer<typeof questionValidationSchema>;
export type ScoreDimension = z.infer<typeof scoreDimensionSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type QuestionsArray = z.infer<typeof questionsArraySchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
