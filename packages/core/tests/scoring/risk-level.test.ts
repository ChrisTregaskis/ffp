import { describe, it, expect } from 'vitest';

import type { DimensionConfig } from '@ffp/database';

import { calculateRiskLevel, getCategoryFromScore } from '../../src/assessments/scoring/helpers';
import { ValidationError } from '../../src/lib/errors';

import type { DimensionalScore } from '../../src/schemas/job.schema';

function createScore(dimensionId: string, normalisedScore: number): DimensionalScore {
  return {
    dimensionId,
    dimensionName: dimensionId,
    rawScore: normalisedScore,
    normalisedScore,
    category: 'low',
  };
}

function createConfig(name: DimensionConfig['name'], affectsRiskLevel?: boolean): DimensionConfig {
  return { name, questionIds: [], maxScore: 100, affectsRiskLevel };
}

describe('Risk level eligibility', () => {
  const scores = [createScore('strength', 80), createScore('balance', 20)];

  it('grades every dimension when none is configured, as before', () => {
    const configs = [createConfig('strength'), createConfig('balance')];

    expect(calculateRiskLevel(scores, configs)).toBe('high');
  });

  it('grades an explicitly eligible dimension the same as an unset one', () => {
    const configs = [createConfig('strength', true), createConfig('balance', true)];

    expect(calculateRiskLevel(scores, configs)).toBe('high');
  });

  it('ignores a dimension kept out of the risk level', () => {
    const configs = [createConfig('strength'), createConfig('balance', false)];

    expect(calculateRiskLevel(scores, configs)).toBe('low');
  });

  it('grades moderate from the lowest eligible dimension', () => {
    const moderateScores = [...scores, createScore('mobility', 55)];
    const configs = [
      createConfig('strength'),
      createConfig('balance', false),
      createConfig('mobility'),
    ];

    expect(calculateRiskLevel(moderateScores, configs)).toBe('moderate');
  });

  it('reports no risk level when no dimension is eligible', () => {
    const configs = [createConfig('strength', false), createConfig('balance', false)];

    expect(calculateRiskLevel(scores, configs)).toBeUndefined();
  });

  it('still refuses a config with no dimensions at all', () => {
    expect(() => calculateRiskLevel([], [])).toThrow(ValidationError);
  });
});

describe('Risk level thresholds', () => {
  const gradeLowest = (lowestScore: number): string | undefined =>
    calculateRiskLevel(
      [createScore('strength', 95), createScore('balance', lowestScore)],
      [createConfig('strength'), createConfig('balance')]
    );

  it('grades a lowest score of exactly 70 as low', () => {
    expect(gradeLowest(70)).toBe('low');
  });

  it('grades a lowest score of 69 as moderate', () => {
    expect(gradeLowest(69)).toBe('moderate');
  });

  it('grades a lowest score of exactly 40 as moderate', () => {
    expect(gradeLowest(40)).toBe('moderate');
  });

  it('grades a lowest score of 39 as high', () => {
    expect(gradeLowest(39)).toBe('high');
  });
});

describe('getCategoryFromScore', () => {
  it('puts a score of exactly 70 in low and 69 in moderate', () => {
    expect(getCategoryFromScore(70)).toBe('low');
    expect(getCategoryFromScore(69)).toBe('moderate');
  });

  it('puts a score of exactly 40 in moderate and 39 in high', () => {
    expect(getCategoryFromScore(40)).toBe('moderate');
    expect(getCategoryFromScore(39)).toBe('high');
  });

  it('applies custom thresholds at their boundaries', () => {
    const thresholds = { low: 80, moderate: 50 };

    expect(getCategoryFromScore(80, thresholds)).toBe('low');
    expect(getCategoryFromScore(79, thresholds)).toBe('moderate');
    expect(getCategoryFromScore(50, thresholds)).toBe('moderate');
    expect(getCategoryFromScore(49, thresholds)).toBe('high');
  });
});
