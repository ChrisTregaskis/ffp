import { questionTypeSchema, scoreDimensionSchema } from '@ffp/core';
import type { QuestionType, ScoreDimension } from '@ffp/core';

import type { SelectOption } from '@web/components/select/types';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  'single-choice': 'Single choice',
  'multi-choice': 'Multiple choice',
  numeric: 'Number',
  text: 'Text',
  scale: 'Scale',
  'video-response': 'Video response',
};

/** Shown beside the type picker. */
export const QUESTION_TYPE_DESCRIPTIONS: Record<QuestionType, string> = {
  'single-choice': 'The member picks one option. Each option can carry a score.',
  'multi-choice': 'The member picks one or more options, up to an optional cap.',
  numeric: 'The member enters a number, optionally within a range.',
  text: 'The member writes a free-text answer, optionally within a length range.',
  scale: 'The member picks a point on a numbered scale.',
  'video-response': 'The member watches a video, then records a numeric result.',
};

export const SCORE_DIMENSION_LABELS: Record<ScoreDimension, string> = {
  activity: 'Activity',
  age: 'Age',
  strength: 'Strength',
  mobility: 'Mobility',
  balance: 'Balance',
};

/** In the order the schema declares them. */
export const QUESTION_TYPE_OPTIONS: SelectOption[] = questionTypeSchema.options.map((type) => ({
  value: type,
  label: QUESTION_TYPE_LABELS[type],
}));

/** The empty value stands for "not scored", which clears the dimension. */
export const SCORE_DIMENSION_OPTIONS: SelectOption[] = [
  { value: '', label: 'Not scored' },
  ...scoreDimensionSchema.options.map((dimension) => ({
    value: dimension,
    label: SCORE_DIMENSION_LABELS[dimension],
  })),
];
