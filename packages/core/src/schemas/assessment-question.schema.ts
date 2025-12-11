import { z } from 'zod';

/**
 * Question type enumeration - defines the available question types for assessments
 *
 * - single-choice: Radio button selection (one option)
 * - multi-choice: Checkbox selection (multiple options)
 * - numeric: Number input field
 * - text: Free text input field
 * - scale: Numeric scale (e.g., 1-10 rating)
 * - video-response: Video-guided physical test with recorded numerical score response
 */
export const questionTypeSchema = z.enum([
  'single-choice',
  'multi-choice',
  'numeric',
  'text',
  'scale',
  'video-response',
]);

export type QuestionType = z.infer<typeof questionTypeSchema>;

/**
 * Question option schema - defines selectable options for choice-based questions
 *
 * Used by single-choice and multi-choice question types.
 * The score field enables automatic scoring when an option is selected.
 */
export const questionOptionSchema = z.object({
  /** Unique value identifier for this option */
  value: z.string().min(1),
  /** Display label shown to the user */
  label: z.string().min(1),
  /** Optional score value for scoring calculations */
  score: z.number().optional(),
});

export type QuestionOption = z.infer<typeof questionOptionSchema>;

/**
 * Question validation schema - defines validation rules for question responses
 */
export const questionValidationSchema = z.object({
  /** Whether an answer is required (defaults to true) */
  required: z.boolean().default(true),
  /** Minimum value (numeric/scale) or minimum length (text) */
  min: z.number().optional(),
  /** Maximum value (numeric/scale) or maximum length (text) */
  max: z.number().optional(),
  /** Regex pattern for text validation */
  pattern: z.string().optional(),
  /** Custom error message for validation failures */
  customError: z.string().optional(),
});

export type QuestionValidation = z.infer<typeof questionValidationSchema>;

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

export type ScoreDimension = z.infer<typeof scoreDimensionSchema>;

/**
 * Assessment question schema - full question definition
 *
 * Represents a single question within an assessment template.
 * Supports multiple question types with type-specific validation.
 *
 * IMPORTANT: When type is 'video-response', videoId is required.
 * This is enforced via .refine() validation.
 */
export const assessmentQuestionSchema = z
  .object({
    /** Unique identifier for the question within the template */
    id: z.string().min(1),
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
    videoId: z.string().uuid().optional(),
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
  );

export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;

/**
 * Questions array schema - validates an array of assessment questions
 *
 * Used for the questions field in assessment templates.
 * Ensures at least one question is present.
 */
export const questionsArraySchema = z
  .array(assessmentQuestionSchema)
  .min(1, 'At least one question is required');

export type QuestionsArray = z.infer<typeof questionsArraySchema>;
