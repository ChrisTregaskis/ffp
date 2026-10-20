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
 * - activity: Everyday activity and exercise tolerance, which sets the level
 * - age: Age bracket, which adjusts the level
 * - strength: Physical strength capacity
 * - mobility: Range of motion and flexibility
 * - balance: Balance and stability
 */
export const SCORE_DIMENSIONS = ['activity', 'age', 'strength', 'mobility', 'balance'] as const;

export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

/**
 * Scoring mode values
 *
 * Defines how a dimension combines its questions' scores:
 * - sum: Adds the per-question scores together
 * - modal: Takes the most frequent per-question score (for tallies such as
 *   "mostly A / mixed / mostly C"), with no single most frequent resolving to
 *   the middle of the scale
 */
export const SCORING_MODES = ['sum', 'modal'] as const;

export type ScoringMode = (typeof SCORING_MODES)[number];
