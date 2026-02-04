/**
 * Question type values
 *
 * Defines the different types of questions available in assessments:
 * - single-choice: Radio button style, one answer from options
 * - multi-choice: Checkbox style, multiple answers from options
 * - numeric: Number input with optional min/max validation
 * - text: Free text input with optional pattern validation
 * - scale: Slider or scale input (e.g., 1-10 pain scale)
 * - video-response: User records/uploads video answer
 */
export const QUESTION_TYPES = [
  'single-choice',
  'multi-choice',
  'numeric',
  'text',
  'scale',
  'video-response',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

/**
 * Score dimension values
 *
 * Defines the dimensions used for assessment scoring:
 * - strength: Physical strength capacity
 * - balance: Balance and stability
 * - mobility: Range of motion and flexibility
 * - pain: Pain levels and impact
 * - general: General fitness or non-specific assessments
 */
export const SCORE_DIMENSIONS = ['strength', 'balance', 'mobility', 'pain', 'general'] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];
