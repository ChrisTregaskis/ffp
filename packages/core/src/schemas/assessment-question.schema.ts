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

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type QuestionValidation = z.infer<typeof questionValidationSchema>;
export type ScoreDimension = z.infer<typeof scoreDimensionSchema>;
export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;
export type QuestionsArray = z.infer<typeof questionsArraySchema>;
