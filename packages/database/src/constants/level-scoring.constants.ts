import type { ProgrammeMapping, QuestionOption, ScoringConfig } from '../types/question.types';

/** The questions the level rule reads */
export const LEVEL_QUESTION_IDS = {
  ageBracket: '22222222-2222-2222-8222-222222220702',
  weeklyActivity: '22222222-2222-2222-8222-222222220703',
  exerciseTolerance: '22222222-2222-2222-8222-222222220704',
  jointComfort: '22222222-2222-2222-8222-222222220705',
} as const;

/** Programme template slugs, one per level */
export const LEVEL_PROGRAMME_SLUGS = {
  1: 'level-1-gentle-mobility',
  2: 'level-2-active-wellness',
  3: 'level-3-energised-dynamic',
} as const;

export type Level = keyof typeof LEVEL_PROGRAMME_SLUGS;

const UNDER_FORTY = 1;
const FORTY_AND_OVER = 0;

/** The age question's brackets; the single age cut is at 40 */
export const AGE_BRACKET_OPTIONS: QuestionOption[] = [
  { value: 'under-20', label: 'Under 20', score: UNDER_FORTY },
  { value: '20-29', label: '20–29', score: UNDER_FORTY },
  { value: '30-39', label: '30–39', score: UNDER_FORTY },
  { value: '40-45', label: '40–45', score: FORTY_AND_OVER },
  { value: '46-55', label: '46–55', score: FORTY_AND_OVER },
  { value: '56-65', label: '56–65', score: FORTY_AND_OVER },
  { value: '65-plus', label: '65+', score: FORTY_AND_OVER },
];

function levelMapping(activity: 1 | 2 | 3, underForty: 0 | 1, level: Level): ProgrammeMapping {
  return {
    operator: 'and',
    conditions: [
      { dimension: 'activity', operator: 'eq', value: activity },
      { dimension: 'age', operator: 'eq', value: underForty },
    ],
    programmeTemplateId: LEVEL_PROGRAMME_SLUGS[level],
  };
}

/**
 * The level rule. The activity tally sets the base level (mostly A → 1, mixed
 * or mostly B → 2, mostly C → 3); under-40s move up one, capped at 3.
 *
 * `activity` is the most frequent A/B/C answer (scored 1/2/3); `age` is 1 for
 * an under-40 bracket, otherwise 0. The six rows cover every pair, so there is
 * no fallback. Neither dimension is a measure of risk.
 */
export const LEVEL_SCORING_CONFIG: ScoringConfig = {
  dimensions: [
    {
      name: 'activity',
      questionIds: [
        LEVEL_QUESTION_IDS.weeklyActivity,
        LEVEL_QUESTION_IDS.exerciseTolerance,
        LEVEL_QUESTION_IDS.jointComfort,
      ],
      maxScore: 3,
      scoringMode: 'modal',
      affectsRiskLevel: false,
    },
    {
      name: 'age',
      questionIds: [LEVEL_QUESTION_IDS.ageBracket],
      maxScore: 1,
      scoringMode: 'sum',
      affectsRiskLevel: false,
    },
  ],
  programmeMappings: [
    // activity, under 40, level
    levelMapping(1, 0, 1),
    levelMapping(1, 1, 2),
    levelMapping(2, 0, 2),
    levelMapping(2, 1, 3),
    levelMapping(3, 0, 3),
    levelMapping(3, 1, 3),
  ],
};
