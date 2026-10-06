import { describe, it, expect } from 'vitest';

import type { DimensionConfig, QuestionOption } from '@ffp/database';

import {
  buildQuestionMap,
  buildResponseMap,
  calculateDimensionScore,
} from '../../src/assessments/scoring/helpers';

import {
  THREE_ANSWER_PATTERNS,
  createAbcQuestion,
  createQuestion,
  createResponses,
} from './scoring-fixtures';

import type { DimensionalScore } from '../../src/schemas/job.schema';

const Q1 = '22222222-2222-4222-8222-222222220001';
const Q2 = '22222222-2222-4222-8222-222222220002';
const Q3 = '22222222-2222-4222-8222-222222220003';

const MODAL_DIMENSION: DimensionConfig = {
  name: 'strength',
  questionIds: [Q1, Q2, Q3],
  maxScore: 3,
  scoringMode: 'modal',
};

const ABC_QUESTIONS = [createAbcQuestion(Q1), createAbcQuestion(Q2), createAbcQuestion(Q3)];

/** Score the modal dimension from answers given as, say, 'A,A,C' */
function scorePattern(
  pattern: string,
  dimension: DimensionConfig = MODAL_DIMENSION,
  questions = ABC_QUESTIONS
): DimensionalScore {
  const answers = pattern.split(',');
  const responses = createResponses(
    Object.fromEntries(
      [Q1, Q2, Q3]
        .map((id, index) => [id, answers.at(index)] as const)
        .filter(([, answer]) => answer !== undefined && answer !== '')
    )
  );

  return calculateDimensionScore(
    dimension,
    buildResponseMap(responses),
    buildQuestionMap(questions)
  );
}

describe('Modal scoring', () => {
  describe('all ten three-answer patterns', () => {
    it.each(THREE_ANSWER_PATTERNS)('$pattern resolves to $activity', ({ pattern, activity }) => {
      expect(scorePattern(pattern).rawScore).toBe(activity);
    });
  });

  describe('where a summed tally would collide', () => {
    it('A,A,C is mostly A (sums to 5, as A,B,B does)', () => {
      expect(scorePattern('A,A,C').rawScore).toBe(1);
      expect(scorePattern('A,B,B').rawScore).toBe(2);
    });

    it('C,C,A is mostly C (sums to 7, as B,B,C does)', () => {
      expect(scorePattern('C,C,A').rawScore).toBe(3);
    });

    it('B,B,C is mostly B (sums to 7, as C,C,A does)', () => {
      expect(scorePattern('B,B,C').rawScore).toBe(2);
    });

    it('A,C,C is mostly C, whatever order the answers arrive in', () => {
      expect(scorePattern('A,C,C').rawScore).toBe(3);
      expect(scorePattern('C,A,C').rawScore).toBe(3);
    });
  });

  describe('no single most frequent score resolves to the middle of the scale', () => {
    it('one of each resolves to 2 on a 1-3 scale', () => {
      expect(scorePattern('A,B,C').rawScore).toBe(2);
    });

    it('a two-way tie between the extremes resolves to the middle', () => {
      expect(scorePattern('A,C,').rawScore).toBe(2);
    });

    it('takes the scale from the option scores offered, not the answers given', () => {
      // A,B tie; the answers span 1-2, but the offered scale is 1-3
      expect(scorePattern('A,B,').rawScore).toBe(2);
    });

    it('resolves to a fraction on an even-width scale', () => {
      const options: QuestionOption[] = [1, 2, 3, 4].map((score) => ({
        value: String(score),
        label: String(score),
        score,
      }));
      const questions = [Q1, Q2, Q3].map((id) => createQuestion(id, 'single-choice', options));

      expect(scorePattern('1,4,2', { ...MODAL_DIMENSION, maxScore: 4 }, questions).rawScore).toBe(
        2.5
      );
    });

    it('falls back to the answered scores when no option carries a score', () => {
      const questions = [Q1, Q2, Q3].map((id) => createQuestion(id, 'scale'));
      const dimension = { ...MODAL_DIMENSION, maxScore: 10 };
      const responses = createResponses({ [Q1]: 2, [Q2]: 8 });

      const score = calculateDimensionScore(
        dimension,
        buildResponseMap(responses),
        buildQuestionMap(questions)
      );

      expect(score.rawScore).toBe(5);
    });
  });

  describe('unanswered questions', () => {
    it('are skipped rather than counted', () => {
      expect(scorePattern('A,A,').rawScore).toBe(1);
      expect(scorePattern('C,,').rawScore).toBe(3);
    });

    it('score 0 when none is answered, as a summed dimension does', () => {
      expect(scorePattern('').rawScore).toBe(0);
    });
  });

  it('normalises the modal score against maxScore', () => {
    const score = scorePattern('B,B,A');

    expect(score).toEqual({
      dimensionId: 'strength',
      dimensionName: 'Strength',
      rawScore: 2,
      normalisedScore: 67,
      category: 'moderate',
    });
  });
});
