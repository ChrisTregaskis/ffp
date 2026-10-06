import type { QuestionOption, QuestionWithConfig } from '@ffp/database';

import type { AssessmentResponse } from '../../src/schemas/job.schema';

/**
 * Build a minimal question for scoring. Only `id`, `type` and `options` affect
 * the score; the rest satisfy the type.
 */
export function createQuestion(
  id: string,
  type: string,
  options: QuestionOption[] | null = null
): QuestionWithConfig {
  return {
    id,
    publicId: id.slice(-12),
    slug: id,
    type,
    questionText: id,
    description: null,
    options,
    validation: null,
    videoId: null,
    scoreDimension: null,
    isActive: true,
    displayOrder: 1,
    configOverrides: null,
  };
}

/** A single-choice question offering A, B and C, scoring 1, 2 and 3 */
export function createAbcQuestion(id: string): QuestionWithConfig {
  return createQuestion(id, 'single-choice', [
    { value: 'A', label: 'A', score: 1 },
    { value: 'B', label: 'B', score: 2 },
    { value: 'C', label: 'C', score: 3 },
  ]);
}

export function createResponses(
  answers: Record<string, AssessmentResponse['answerValue']>
): AssessmentResponse[] {
  return Object.entries(answers).map(([questionId, answerValue]) => ({ questionId, answerValue }));
}

/** Every distinct set of three A/B/C answers, with the tally each resolves to */
export const THREE_ANSWER_PATTERNS = [
  { pattern: 'A,A,A', activity: 1 },
  { pattern: 'B,B,B', activity: 2 },
  { pattern: 'C,C,C', activity: 3 },
  { pattern: 'A,A,B', activity: 1 },
  { pattern: 'A,A,C', activity: 1 },
  { pattern: 'A,B,B', activity: 2 },
  { pattern: 'B,B,C', activity: 2 },
  { pattern: 'A,C,C', activity: 3 },
  { pattern: 'B,C,C', activity: 3 },
  { pattern: 'A,B,C', activity: 2 },
] as const;
