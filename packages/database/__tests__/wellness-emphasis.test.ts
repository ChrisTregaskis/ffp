import { describe, expect, it } from 'vitest';

import { DEFAULT_FLOWS, FLOW_IDS } from '../seed/seedAssessmentFlows';
import { DEFAULT_QUESTIONS, QUESTION_IDS } from '../seed/seedQuestions';

const rules =
  DEFAULT_FLOWS.find((flow) => flow.id === FLOW_IDS.WELLNESS)?.scoringConfig.emphasis ?? [];

/** Tag weights (`category:slug`) the rules give a set of single answers, as the draw sums them */
const weightsFor = (answers: Record<string, string>): Map<string, number> => {
  const weights = new Map<string, number>();

  for (const rule of rules.filter((rule) => answers[rule.questionId] === rule.answerValue)) {
    for (const { category, slug, weight } of rule.tags) {
      weights.set(`${category}:${slug}`, (weights.get(`${category}:${slug}`) ?? 0) + weight);
    }
  }

  return weights;
};

const goalAnswers = [
  ...new Set(
    rules
      .filter((rule) => rule.questionId === QUESTION_IDS['session-goal'])
      .map((rule) => rule.answerValue)
  ),
];

describe('Wellness emphasis', () => {
  it('has rules for each goal answer', () => {
    expect(goalAnswers.length).toBeGreaterThan(0);
  });

  it.each(goalAnswers)(
    'a low-activity member with the %s goal leans to stretch and mobility over strength',
    (goal) => {
      const weights = weightsFor({
        [QUESTION_IDS['weekly-activity']]: 'low',
        [QUESTION_IDS['session-goal']]: goal,
      });
      const goalTagWeight = Math.max(
        0,
        ...[...weights].filter(([key]) => key.startsWith('goal:')).map(([, weight]) => weight)
      );
      // A strength video can carry the goal's own tag as well
      const heaviestStrength = (weights.get('movement:strength') ?? 0) + goalTagWeight;

      expect(weights.get('movement:stretch') ?? 0).toBeGreaterThan(heaviestStrength);
      expect(weights.get('movement:mobility') ?? 0).toBeGreaterThan(heaviestStrength);
    }
  );

  // A rule naming a missing question or option, or a non-choice question, never matches and logs nothing
  it.each(rules.map((rule) => [`${rule.questionId} = ${rule.answerValue}`, rule] as const))(
    '%s names an option of a seeded choice question',
    (_label, rule) => {
      const question = DEFAULT_QUESTIONS.find(({ id }) => id === rule.questionId);

      expect(['single-choice', 'multi-choice']).toContain(question?.type);
      expect(question?.options?.map(({ value }) => value)).toContain(rule.answerValue);
    }
  );
});
