import { describe, expect, it } from 'vitest';

import type { ScoringDryRunDimension, ScoringDryRunQuestion } from '@ffp/core';

import { findScenario, planScenarios } from './scoring-scenarios';

const abcQuestion = (publicId: string): ScoringDryRunQuestion => ({
  publicId,
  slug: publicId,
  type: 'single-choice',
  questionText: `Question ${publicId}`,
  options: [
    { value: 'low', label: 'Low', score: 1 },
    { value: 'moderate', label: 'Moderate', score: 2 },
    { value: 'active', label: 'Active', score: 3 },
  ],
});

const AGE: ScoringDryRunQuestion = {
  publicId: 'ageBracket01',
  slug: 'age-bracket',
  type: 'single-choice',
  questionText: 'Which age bracket are you in?',
  options: [
    { value: 'under-20', label: 'Under 20', score: 1 },
    { value: '30-39', label: '30–39', score: 1 },
    { value: '40-45', label: '40–45', score: 0 },
    { value: '65-plus', label: '65+', score: 0 },
  ],
};

const dimension = (
  overrides: Partial<ScoringDryRunDimension> & Pick<ScoringDryRunDimension, 'name' | 'questions'>
): ScoringDryRunDimension => ({
  displayName: overrides.name.charAt(0).toUpperCase() + overrides.name.slice(1),
  scoringMode: 'sum',
  maxScore: 3,
  affectsRiskLevel: false,
  unresolvedQuestionCount: 0,
  ...overrides,
});

const ACTIVITY_QUESTIONS = ['weekly000001', 'tolerance001', 'comfort00001'].map(abcQuestion);

const LEVEL_DIMENSIONS = [
  dimension({ name: 'activity', scoringMode: 'modal', questions: ACTIVITY_QUESTIONS }),
  dimension({ name: 'age', maxScore: 1, questions: [AGE] }),
];

describe('planScenarios', () => {
  it('crosses the ten activity patterns with both age bands', () => {
    const plan = planScenarios(LEVEL_DIMENSIONS);

    if (!plan.fits) {
      throw new Error(plan.reasons.join(' '));
    }

    expect(plan.scenarios).toHaveLength(20);
    expect(plan.tallyScores).toEqual([1, 2, 3]);
    expect(new Set(plan.scenarios.map((scenario) => scenario.label)).size).toBe(20);
  });

  it('names each scenario for what it describes', () => {
    const plan = planScenarios(LEVEL_DIMENSIONS);

    if (!plan.fits) {
      throw new Error('expected the level dimensions to fit');
    }

    const labels = plan.scenarios.map((scenario) => scenario.label);

    expect(labels).toContain('All lower activity · Age Under 20 to 30–39');
    expect(labels).toContain('Mostly lower activity, one higher · Age 40–45 to 65+');
    expect(labels).toContain('Mostly higher activity, one lower · Age 40–45 to 65+');
    expect(labels).toContain('Evenly mixed activity, one of each · Age Under 20 to 30–39');
  });

  it('answers each question with an option scoring the pattern’s level', () => {
    const plan = planScenarios(LEVEL_DIMENSIONS);

    if (!plan.fits) {
      throw new Error('expected the level dimensions to fit');
    }

    const scenario = plan.scenarios.find(
      (each) => each.label === 'Mostly lower activity, one higher · Age 40–45 to 65+'
    );

    expect(scenario?.answers).toEqual({
      weekly000001: 'low',
      tolerance001: 'low',
      comfort00001: 'active',
      ageBracket01: '40-45',
    });
  });

  it('says why a flow scored by summed dimensions does not fit', () => {
    const plan = planScenarios([
      dimension({ name: 'strength', questions: [abcQuestion('squat0000001')] }),
      dimension({ name: 'balance', questions: [abcQuestion('stand0000001')] }),
    ]);

    expect(plan.fits).toBe(false);
    expect(plan.fits ? [] : plan.reasons).toEqual([
      expect.stringContaining('This flow’s scoring has none.'),
    ]);
  });

  it('refuses a tally whose questions are missing from the flow or not scored choices', () => {
    const plan = planScenarios([
      dimension({
        name: 'activity',
        scoringMode: 'modal',
        questions: [{ ...abcQuestion('weekly000001'), type: 'text', options: null }],
        unresolvedQuestionCount: 2,
      }),
    ]);

    expect(plan.fits ? [] : plan.reasons).toEqual([
      expect.stringContaining('reads two questions this flow does not show'),
      expect.stringContaining('is not a single-choice question'),
    ]);
  });

  it('refuses tally questions that offer different answer scores', () => {
    const uneven = {
      ...abcQuestion('comfort00001'),
      options: [
        { value: 'a', label: 'A', score: 1 },
        { value: 'b', label: 'B', score: 4 },
      ],
    };
    const plan = planScenarios([
      dimension({
        name: 'activity',
        scoringMode: 'modal',
        questions: [abcQuestion('weekly000001'), uneven],
      }),
    ]);

    expect(plan.fits ? [] : plan.reasons).toEqual([
      expect.stringContaining('do not all offer the same answer scores'),
    ]);
  });
});

describe('findScenario', () => {
  it('finds the scenario until its answers are changed', () => {
    const plan = planScenarios(LEVEL_DIMENSIONS);

    if (!plan.fits) {
      throw new Error('expected the level dimensions to fit');
    }

    const [first] = plan.scenarios;

    expect(findScenario(plan.scenarios, first.answers)).toBe(first);
    expect(findScenario(plan.scenarios, { ...first.answers, ageBracket01: '' })).toBeUndefined();
  });
});
