import type { AssessmentFlowWithStepsView } from '@web/lib/api/endpoints';

import type { AssessmentFlowFormValues } from './types';

export const EMPTY_ASSESSMENT_FLOW_VALUES: AssessmentFlowFormValues = { name: '', description: '' };

export const toAssessmentFlowFormValues = (
  flow: AssessmentFlowWithStepsView
): AssessmentFlowFormValues => ({
  name: flow.name,
  description: flow.description ?? '',
});
