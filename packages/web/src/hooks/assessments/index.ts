import { useAssessmentFlowQuery } from './useAssessmentFlowQuery';
import { useAssessmentTemplateQuery } from './useAssessmentTemplateQuery';
import { useSaveProgress } from './useSaveProgress';
import { useStartAssessment } from './useStartAssessment';
import { useSubmitAssessment } from './useSubmitAssessment';

import type { SaveProgressInput } from './useSaveProgress';
import type { StartAssessmentInput } from './useStartAssessment';
import type { SubmitAssessmentInput } from './useSubmitAssessment';

export {
  useAssessmentFlowQuery,
  useAssessmentTemplateQuery,
  useSaveProgress,
  useStartAssessment,
  useSubmitAssessment,
};

export type { SaveProgressInput, StartAssessmentInput, SubmitAssessmentInput };
