import { describe, it, expect } from 'vitest';

import type { ScoringConfig } from '@ffp/database';

import { calculateScores } from '../../src/assessments/scoring';

import { createQuestion, createResponses } from './scoring-fixtures';

const MOBILITY_CHOICE = '11111111-1111-4111-8111-111111110001';
const MOBILITY_SCALE = '11111111-1111-4111-8111-111111110002';
const ACTIVITY = '11111111-1111-4111-8111-111111110003';
const STRENGTH = '11111111-1111-4111-8111-111111110004';
const BALANCE = '11111111-1111-4111-8111-111111110005';

const QUESTIONS = [
  createQuestion(MOBILITY_CHOICE, 'single-choice', [
    { value: 'none', label: 'None', score: 0 },
    { value: 'mild', label: 'Mild', score: 5 },
    { value: 'severe', label: 'Severe', score: 10 },
  ]),
  createQuestion(MOBILITY_SCALE, 'scale'),
  createQuestion(ACTIVITY, 'single-choice', [
    { value: '0', label: 'Rarely', score: 0 },
    { value: '1', label: 'Sometimes', score: 1 },
    { value: '2', label: 'Often', score: 2 },
  ]),
  createQuestion(STRENGTH, 'multi-choice', [
    { value: 'a', label: 'Stairs', score: 4 },
    { value: 'b', label: 'Carrying', score: 4 },
    { value: 'c', label: 'Lifting', score: 8 },
  ]),
  createQuestion(BALANCE, 'single-choice', [
    { value: 'unsteady', label: 'Unsteady', score: 0 },
    { value: 'fair', label: 'Fair', score: 3 },
    { value: 'steady', label: 'Steady', score: 6 },
  ]),
];

/**
 * Mirrors the shape of the stored flow configs that predate modal scoring and
 * risk eligibility: no `scoringMode`, no `affectsRiskLevel`, mixed weights, the
 * inverted thresholds on the first dimension, and priority-ordered mappings ending in an
 * unconditional fallback. Every expected value below is worked by hand.
 */
const STORED_CONFIG: ScoringConfig = {
  dimensions: [
    {
      name: 'mobility',
      questionIds: [MOBILITY_CHOICE, MOBILITY_SCALE],
      maxScore: 20,
      weight: 1,
      riskThresholds: { low: 15, moderate: 30 },
    },
    { name: 'activity', questionIds: [ACTIVITY], maxScore: 2, weight: 1 },
    {
      name: 'strength',
      questionIds: [STRENGTH],
      maxScore: 16,
      weight: 1.5,
      riskThresholds: { low: 20, moderate: 40 },
    },
    {
      name: 'balance',
      questionIds: [BALANCE],
      maxScore: 6,
      weight: 1.2,
      riskThresholds: { low: 6, moderate: 12 },
    },
  ],
  // Deliberately out of priority order, to pin the lowest-first sort
  programmeMappings: [
    { priority: 10, conditions: [], programmeTemplateId: 'general-wellness-programme' },
    {
      priority: 3,
      operator: 'and',
      conditions: [
        { dimension: 'strength', operator: 'lt', value: 20 },
        { dimension: 'balance', operator: 'lt', value: 6 },
      ],
      programmeTemplateId: 'foundation-programme',
    },
    {
      priority: 2,
      conditions: [{ dimension: 'mobility', operator: 'gte', value: 20 }],
      programmeTemplateId: 'gentle-mobility-programme',
    },
    {
      priority: 1,
      conditions: [{ dimension: 'mobility', operator: 'gte', value: 35 }],
      programmeTemplateId: 'gentle-mobility-programme',
    },
  ],
};

describe('Summed scoring (regression pin)', () => {
  it('scores, weights, grades risk and matches a programme as before', () => {
    const responses = createResponses({
      [MOBILITY_CHOICE]: 'mild',
      [MOBILITY_SCALE]: 3,
      [ACTIVITY]: '1',
      [STRENGTH]: ['a', 'c'],
      [BALANCE]: 'fair',
    });

    const result = calculateScores(responses, QUESTIONS, STORED_CONFIG);

    expect(result.scores).toEqual([
      {
        dimensionId: 'mobility',
        dimensionName: 'Mobility',
        rawScore: 8,
        normalisedScore: 40,
        category: 'low',
      },
      {
        dimensionId: 'activity',
        dimensionName: 'Activity',
        rawScore: 1,
        normalisedScore: 50,
        category: 'moderate',
      },
      {
        dimensionId: 'strength',
        dimensionName: 'Strength',
        rawScore: 12,
        normalisedScore: 75,
        category: 'low',
      },
      {
        dimensionId: 'balance',
        dimensionName: 'Balance',
        rawScore: 3,
        normalisedScore: 50,
        category: 'low',
      },
    ]);
    // (40 + 50 + 75 × 1.5 + 50 × 1.2) / 4.7 = 55.85
    expect(result.overallScore).toBe(56);
    // Lowest normalised score is 40, across every dimension
    expect(result.riskLevel).toBe('moderate');
    expect(result.recommendedProgrammeId).toBe('foundation-programme');
  });

  it('evaluates the lowest priority first', () => {
    const responses = createResponses({
      [MOBILITY_CHOICE]: 'severe',
      [MOBILITY_SCALE]: 10,
      [BALANCE]: 'unsteady',
    });

    const result = calculateScores(responses, QUESTIONS, STORED_CONFIG);

    // Mobility 20 and strength 0 / balance 0 satisfy both priority 2 and priority 3
    expect(result.recommendedProgrammeId).toBe('gentle-mobility-programme');
  });

  it('falls through to the unconditional mapping', () => {
    const responses = createResponses({
      [MOBILITY_CHOICE]: 'none',
      [STRENGTH]: ['a', 'b', 'c'],
      [BALANCE]: 'steady',
    });

    const result = calculateScores(responses, QUESTIONS, STORED_CONFIG);

    expect(result.recommendedProgrammeId).toBe('general-wellness-programme');
  });

  it('grades high risk from the lowest dimension, with nothing answered', () => {
    const result = calculateScores([], QUESTIONS, STORED_CONFIG);

    expect(result.scores.map((score) => score.rawScore)).toEqual([0, 0, 0, 0]);
    expect(result.overallScore).toBe(0);
    expect(result.riskLevel).toBe('high');
    expect(result.recommendedProgrammeId).toBe('foundation-programme');
  });

  it('scores an explicit sum mode exactly as an unset one', () => {
    const responses = createResponses({
      [MOBILITY_CHOICE]: 'mild',
      [MOBILITY_SCALE]: 3,
      [ACTIVITY]: '1',
      [STRENGTH]: ['a', 'c'],
      [BALANCE]: 'fair',
    });
    const explicitConfig: ScoringConfig = {
      ...STORED_CONFIG,
      dimensions: STORED_CONFIG.dimensions.map((dimension) => ({
        ...dimension,
        scoringMode: 'sum',
        affectsRiskLevel: true,
      })),
    };

    const { scoredAt: _unset, ...unset } = calculateScores(responses, QUESTIONS, STORED_CONFIG);
    const { scoredAt: _explicit, ...explicit } = calculateScores(
      responses,
      QUESTIONS,
      explicitConfig
    );

    expect(explicit).toEqual(unset);
  });
});
