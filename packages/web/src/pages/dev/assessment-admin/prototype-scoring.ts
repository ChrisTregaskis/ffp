/**
 * Shared scoring primitives for the assessment-admin prototype.
 *
 * The level decision itself lives in prototype-level-model.ts (a modal activity
 * tally plus an age bump). This module keeps only the small, reusable pieces:
 * the sample-answer types and how a single answer earns its option score.
 */
import type { PrototypeQuestion } from './prototype-types';

/** A sample answer for one question (single-choice value, multi values, or a number). */
export type SampleAnswer = string | number | string[];
export type SampleAnswers = Record<string, SampleAnswer>;

/** The score a single answer earns for its question (single/multi-choice option scores). */
export const scoreQuestion = (
  question: PrototypeQuestion,
  answer: SampleAnswer | undefined
): number => {
  if (answer === undefined) {
    return 0;
  }

  switch (question.type) {
    case 'single-choice': {
      if (typeof answer !== 'string') {
        return 0;
      }

      return question.options?.find((option) => option.value === answer)?.score ?? 0;
    }
    case 'multi-choice': {
      if (!Array.isArray(answer)) {
        return 0;
      }

      return answer.reduce(
        (sum, value) => sum + (question.options?.find((o) => o.value === value)?.score ?? 0),
        0
      );
    }
    case 'numeric':
    case 'scale':
      return typeof answer === 'number' ? Math.max(0, answer) : 0;
    default:
      return 0; // text, video-response
  }
};
