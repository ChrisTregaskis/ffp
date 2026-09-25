import type { QuestionWithConfig } from '@ffp/database';

/**
 * Resolve a modal dimension's raw score from its answered questions' scores
 *
 * The raw score is the most frequent per-question score. Modal scoring is meant
 * for single-choice tallies ("mostly A / mixed / mostly C"), so every question in
 * a modal dimension should be a scored single-choice question: an unscored
 * answer (a text question, say) still counts as a vote for 0, and a multi-choice
 * question contributes one value, the sum of its selected options.
 *
 * - **No single most frequent score** (a tie, such as one of each) resolves to
 *   the middle of the scale: the midpoint of the lowest and highest option score
 *   the dimension's questions offer, so 2 on a 1-3 scale. The midpoint is not
 *   rounded, so an even-width scale (1-4) resolves to a fraction (2.5). Where
 *   the questions carry no option scores, the answered scores define the scale,
 *   not the questions' own range.
 * - **No answered questions** resolve to 0, matching what a summed dimension
 *   scores with nothing answered.
 *
 * @param answeredScores - Per-question scores for the answered questions
 * @param questions - The dimension's questions, which define the scale
 * @returns The modal raw score
 */
export function resolveModalScore(
  answeredScores: number[],
  questions: QuestionWithConfig[]
): number {
  if (answeredScores.length === 0) {
    return 0;
  }

  const frequencies = new Map<number, number>();

  for (const score of answeredScores) {
    frequencies.set(score, (frequencies.get(score) ?? 0) + 1);
  }

  const highestFrequency = Math.max(...frequencies.values());
  const mostFrequent = [...frequencies.entries()]
    .filter(([, frequency]) => frequency === highestFrequency)
    .map(([score]) => score);

  if (mostFrequent.length === 1) {
    return mostFrequent[0];
  }

  return scaleMidpoint(questions, answeredScores);
}

function scaleMidpoint(questions: QuestionWithConfig[], answeredScores: number[]): number {
  const optionScores = questions.flatMap((question) =>
    (question.options ?? [])
      .map((option) => option.score)
      .filter((score): score is number => score !== undefined)
  );
  const scale = optionScores.length > 0 ? optionScores : answeredScores;

  return (Math.min(...scale) + Math.max(...scale)) / 2;
}
