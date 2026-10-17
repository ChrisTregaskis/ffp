import type { AdminAssessmentTemplateDetail } from '@web/lib/api/endpoints';

import type { AssessmentTemplateFormValues } from './types';

export const EMPTY_ASSESSMENT_TEMPLATE_VALUES: AssessmentTemplateFormValues = {
  name: '',
  description: '',
};

export const toAssessmentTemplateFormValues = (
  template: AdminAssessmentTemplateDetail
): AssessmentTemplateFormValues => ({
  name: template.name,
  description: template.description ?? '',
});
