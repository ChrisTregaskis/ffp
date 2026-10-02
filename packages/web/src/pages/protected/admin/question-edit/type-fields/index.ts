import type { QuestionType } from '@ffp/core';

import { MultiChoiceFields } from './MultiChoiceFields';
import { NumericFields } from './NumericFields';
import { ScaleFields } from './ScaleFields';
import { SingleChoiceFields } from './SingleChoiceFields';
import { TextFields } from './TextFields';
import { VideoResponseFields } from './VideoResponseFields';

import type { FC } from 'react';

/** The fields each type adds beyond the ones every question shares. */
export const QUESTION_TYPE_FIELDS: Record<QuestionType, FC> = {
  'single-choice': SingleChoiceFields,
  'multi-choice': MultiChoiceFields,
  numeric: NumericFields,
  text: TextFields,
  scale: ScaleFields,
  'video-response': VideoResponseFields,
};
