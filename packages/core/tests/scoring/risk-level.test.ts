import { describe, it, expect } from 'vitest';

import type { DimensionConfig } from '@ffp/database';

import { calculateRiskLevel } from '../../src/assessments/scoring/helpers';
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
