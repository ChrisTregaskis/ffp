import { describe, it, expect } from 'vitest';

import { calculateQuestionScore } from '../../src/assessments/scoring/helpers';

import { createQuestion } from './scoring-fixtures';

describe('calculateQuestionScore — numeric and scale answers', () => {
  it('scores a numeric answer as its value', () => {
    expect(calculateQuestionScore(createQuestion('q-reps', 'numeric'), 12)).toBe(12);
  });

  it('scores a negative numeric answer as zero', () => {
    expect(calculateQuestionScore(createQuestion('q-reps', 'numeric'), -5)).toBe(0);
  });

  it('scores a negative scale answer as zero', () => {
    expect(calculateQuestionScore(createQuestion('q-pain', 'scale'), -1)).toBe(0);
  });
});
