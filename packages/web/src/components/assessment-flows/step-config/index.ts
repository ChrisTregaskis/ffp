import type { FlowStepType } from '@ffp/core';

import { IntroStepFields } from './IntroStepFields';
import { QuestionsStepFields } from './QuestionsStepFields';
import { TransitionStepFields } from './TransitionStepFields';
import { VideoAssessmentStepFields } from './VideoAssessmentStepFields';

import type { FC } from 'react';

/**
 * Extra fields per type, beyond the title and description every step shares.
 * `results` and `programme-overview` are absent — they render what the
 * assessment already produced, so there is nothing to author.
 */
export const STEP_CONFIG_FIELDS: Partial<Record<FlowStepType, FC>> = {
  intro: IntroStepFields,
  questions: QuestionsStepFields,
  transition: TransitionStepFields,
  'video-assessment': VideoAssessmentStepFields,
};
