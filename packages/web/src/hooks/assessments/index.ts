import { useAssessmentFlowQuery } from './useAssessmentFlowQuery';
import { useAssessmentResultsQuery } from './useAssessmentResultsQuery';
import { useAssessmentTemplateQuery } from './useAssessmentTemplateQuery';
import { useSaveProgress } from './useSaveProgress';
import { useStartAssessment } from './useStartAssessment';
import { useSubmitAssessment } from './useSubmitAssessment';
import { useUserAssessmentStatusQuery } from './useUserAssessmentStatusQuery';

import type { SaveProgressInput } from './useSaveProgress';
import type { StartAssessmentInput } from './useStartAssessment';
import type { SubmitAssessmentInput } from './useSubmitAssessment';

export {
  useAssessmentFlowQuery,
  useAssessmentResultsQuery,
  useAssessmentTemplateQuery,
  useSaveProgress,
  useStartAssessment,
  useSubmitAssessment,
  useUserAssessmentStatusQuery,
};

export type { SaveProgressInput, StartAssessmentInput, SubmitAssessmentInput };
