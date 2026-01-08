import type { QuestionWithConfig, QuestionOption } from '@ffp/database';

/**
 * Calculate score for a single question based on answer value
 *
 * Handles different question types:
 * - single-choice: Returns score from selected option
 * - multi-choice: Sums scores from all selected options
 * - numeric/scale: Returns the numeric value directly
 * - text: Returns 0 (text questions are not scored)
 *
 * Note: video-response questions are not currently scored (post-MVP feature).
 *
 * @param question - Question with options and scoring configuration
 * @param answerValue - User's answer (string, number, or string[])
 * @returns Numeric score value
 */
export function calculateQuestionScore(
  question: QuestionWithConfig,
  answerValue: string | number | string[]
): number {
  switch (question.type) {
    case 'single-choice':
      return calculateSingleChoiceScore(question.options, answerValue);

    case 'multi-choice':
      return calculateMultiChoiceScore(question.options, answerValue);

    case 'numeric':
    case 'scale':
      return calculateNumericScore(answerValue);

    case 'text':
      // Text questions are informational only, not scored
      return 0;

    default:
      return 0;
  }
}

/**
 * Calculate score for single-choice question
 *
 * Finds the selected option and returns its score value.
 */
function calculateSingleChoiceScore(
  options: QuestionOption[] | null,
  answerValue: string | number | string[]
): number {
  if (!options || typeof answerValue !== 'string') {
    return 0;
  }

  const selectedOption = options.find((opt) => opt.value === answerValue);

  return selectedOption?.score ?? 0;
}

/**
 * Calculate score for multi-choice question
 *
 * Sums scores from all selected options.
 */
function calculateMultiChoiceScore(
  options: QuestionOption[] | null,
  answerValue: string | number | string[]
): number {
  if (!options || !Array.isArray(answerValue)) {
    return 0;
  }

  let totalScore = 0;

  for (const value of answerValue) {
    const selectedOption = options.find((opt) => opt.value === value);

    if (selectedOption?.score !== undefined) {
      totalScore += selectedOption.score;
    }
  }

  return totalScore;
}

/**
 * Calculate score for numeric/scale question
 *
 * Returns the numeric value directly (clamped to non-negative).
 */
function calculateNumericScore(answerValue: string | number | string[]): number {
  if (typeof answerValue === 'number') {
    return Math.max(0, answerValue);
  }

  return 0;
}
