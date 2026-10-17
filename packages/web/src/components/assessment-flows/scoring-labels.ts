import type { ComparisonOperator, NotScorableReason, ProgrammeMappingCondition } from '@ffp/core';

export const NOT_SCORABLE_MESSAGES: Record<NotScorableReason, string> = {
  'no-config':
    'This flow has no scoring set up, so there is nothing to test, and a member’s answers to it cannot be scored.',
  'no-dimensions':
    'This flow’s scoring has no dimensions, so there is nothing to test, and a member’s answers to it cannot be scored.',
};

const OPERATOR_SYMBOLS: Record<ComparisonOperator, string> = {
  lt: '<',
  lte: '≤',
  gt: '>',
  gte: '≥',
  eq: '=',
};

const RANK_NAMES: Partial<Record<number, readonly string[]>> = {
  2: ['lower', 'higher'],
  3: ['lower', 'middle', 'higher'],
};

export const MAX_TALLY_LEVELS = 3;

const COUNT_WORDS = ['none', 'one', 'two', 'three', 'four', 'five'];

export const countWord = (count: number): string => COUNT_WORDS.at(count) ?? String(count);

export const rankNames = (levels: number): readonly string[] | undefined => RANK_NAMES[levels];

export const formatCondition = (condition: ProgrammeMappingCondition): string =>
  `${condition.dimension} ${OPERATOR_SYMBOLS[condition.operator]} ${String(condition.value)}`;

export const formatScore = (score: number): string => String(Math.round(score * 100) / 100);

export const NO_ANSWER_LABEL = 'No answer';

export const EDITED_SCENARIO_LABEL = 'Edited answers';
