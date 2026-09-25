import { describe, it, expect } from 'vitest';

import type { ScoreDimension, ScoringConfig } from '@ffp/database';

import { calculateScores } from '../../src/assessments/scoring';

import {
  THREE_ANSWER_PATTERNS,
  createAbcQuestion,
  createQuestion,
  createResponses,
} from './scoring-fixtures';

// The fixture carries the level rule's activity tally and age cut on two
// existing dimension names; the rule only needs them to be distinct.
const ACTIVITY: ScoreDimension = 'strength';
const AGE: ScoreDimension = 'balance';

const ACTIVITY_QUESTIONS = [
  '33333333-3333-4333-8333-333333330001',
  '33333333-3333-4333-8333-333333330002',
  '33333333-3333-4333-8333-333333330003',
];
const AGE_QUESTION = '33333333-3333-4333-8333-333333330004';

const QUESTIONS = [
  ...ACTIVITY_QUESTIONS.map(createAbcQuestion),
  createQuestion(AGE_QUESTION, 'single-choice', [
    { value: 'under-40', label: 'Under 40', score: 1 },
    { value: '40-plus', label: '40 and over', score: 0 },
  ]),
];

const LEVEL_TEMPLATES = { 1: 'level-1', 2: 'level-2', 3: 'level-3' } as const;

/** Level = min(3, activity tally + 1 for under-40s), as six enumerated rows */
const LEVEL_CONFIG: ScoringConfig = {
  dimensions: [
    {
      name: ACTIVITY,
      questionIds: ACTIVITY_QUESTIONS,
      maxScore: 3,
      scoringMode: 'modal',
      affectsRiskLevel: false,
    },
    {
      name: AGE,
      questionIds: [AGE_QUESTION],
      maxScore: 1,
      scoringMode: 'sum',
      affectsRiskLevel: false,
    },
  ],
  programmeMappings: [
    [1, 0, 1],
    [1, 1, 2],
    [2, 0, 2],
    [2, 1, 3],
    [3, 0, 3],
    [3, 1, 3],
  ].map(([activity, age, level]) => ({
    operator: 'and' as const,
    conditions: [
      { dimension: ACTIVITY, operator: 'eq' as const, value: activity },
      { dimension: AGE, operator: 'eq' as const, value: age },
    ],
    programmeTemplateId: LEVEL_TEMPLATES[level as 1 | 2 | 3],
  })),
};

const AGE_ANSWERS = [
  { age: 'under-40', bonus: 1 },
  { age: '40-plus', bonus: 0 },
] as const;

const MATRIX = THREE_ANSWER_PATTERNS.flatMap(({ pattern, activity }) =>
  AGE_ANSWERS.map(({ age, bonus }) => ({
    pattern,
    age,
    level: Math.min(3, activity + bonus) as 1 | 2 | 3,
  }))
);

describe('Level rule', () => {
  it.each(MATRIX)('$pattern, $age → level $level', ({ pattern, age, level }) => {
    const answers = pattern.split(',');
    const responses = createResponses({
      ...Object.fromEntries(ACTIVITY_QUESTIONS.map((id, index) => [id, answers[index]])),
      [AGE_QUESTION]: age,
    });

    const result = calculateScores(responses, QUESTIONS, LEVEL_CONFIG);

    expect(result.recommendedProgrammeId).toBe(LEVEL_TEMPLATES[level]);
  });

  it('covers all twenty answer combinations', () => {
    expect(MATRIX).toHaveLength(20);
  });

  it('keeps age and activity out of the risk level', () => {
    const responses = createResponses({
      [ACTIVITY_QUESTIONS[0]]: 'A',
      [ACTIVITY_QUESTIONS[1]]: 'A',
      [ACTIVITY_QUESTIONS[2]]: 'A',
      [AGE_QUESTION]: '40-plus',
    });

    const result = calculateScores(responses, QUESTIONS, LEVEL_CONFIG);

    expect(result.riskLevel).toBeUndefined();
  });
});
