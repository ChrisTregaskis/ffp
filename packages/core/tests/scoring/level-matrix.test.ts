import { describe, it, expect } from 'vitest';

import {
  AGE_BRACKET_OPTIONS,
  LEVEL_PROGRAMME_SLUGS,
  LEVEL_QUESTION_IDS,
  LEVEL_SCORING_CONFIG,
  type Level,
} from '@ffp/database/constants';

import { calculateScores } from '../../src/assessments/scoring';
import { findMatchingProgramme } from '../../src/assessments/scoring/helpers';

import {
  THREE_ANSWER_PATTERNS,
  createAbcQuestion,
  createQuestion,
  createResponses,
} from './scoring-fixtures';

import type { ScoringResult } from '../../src/types';

const ACTIVITY_QUESTIONS = [
  LEVEL_QUESTION_IDS.weeklyActivity,
  LEVEL_QUESTION_IDS.exerciseTolerance,
  LEVEL_QUESTION_IDS.jointComfort,
];

const QUESTIONS = [
  ...ACTIVITY_QUESTIONS.map(createAbcQuestion),
  createQuestion(LEVEL_QUESTION_IDS.ageBracket, 'single-choice', AGE_BRACKET_OPTIONS),
];

// Stated independently of the options, so a mis-scored bracket fails here
const UNDER_FORTY_BRACKETS = ['under-20', '20-29', '30-39'];

const MATRIX = THREE_ANSWER_PATTERNS.flatMap(({ pattern, activity }) =>
  AGE_BRACKET_OPTIONS.map(({ value: age }) => ({
    pattern,
    age,
    level: Math.min(3, activity + (UNDER_FORTY_BRACKETS.includes(age) ? 1 : 0)) as Level,
  }))
);

function scoreAnswers(activityAnswers: string[], age: string): ScoringResult {
  const responses = createResponses({
    ...Object.fromEntries(ACTIVITY_QUESTIONS.map((id, index) => [id, activityAnswers[index]])),
    [LEVEL_QUESTION_IDS.ageBracket]: age,
  });

  return calculateScores(responses, QUESTIONS, LEVEL_SCORING_CONFIG);
}

describe('Level rule', () => {
  it.each(MATRIX)('$pattern, $age → level $level', ({ pattern, age, level }) => {
    const result = scoreAnswers(pattern.split(','), age);

    expect(result.recommendedProgrammeId).toBe(LEVEL_PROGRAMME_SLUGS[level]);
  });

  it('covers every answer pattern against every age bracket', () => {
    expect(MATRIX).toHaveLength(70);
  });

  it('maps every activity and age pair to exactly one level', () => {
    for (const activity of [1, 2, 3]) {
      for (const age of [0, 1]) {
        const matches = LEVEL_SCORING_CONFIG.programmeMappings.filter((mapping) =>
          findMatchingProgramme(
            [
              {
                dimensionId: 'activity',
                dimensionName: '',
                rawScore: activity,
                normalisedScore: 0,
                category: 'low',
              },
              {
                dimensionId: 'age',
                dimensionName: '',
                rawScore: age,
                normalisedScore: 0,
                category: 'low',
              },
            ],
            [mapping]
          )
        );

        expect(matches, `activity ${String(activity)}, age ${String(age)}`).toHaveLength(1);
      }
    }
  });

  it('keeps age and activity out of the risk level', () => {
    const result = scoreAnswers(['A', 'A', 'A'], '46-55');

    expect(result.riskLevel).toBeUndefined();
  });
});
