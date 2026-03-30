import type { UserAssessmentStatusResponse } from '@web/lib/api/endpoints/assessments';

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

/**
 * Only returns true for first-time users who have never had a programme.
 * Users with completed/archived programmes land on the dashboard instead.
 */
export const shouldRedirectToAssessment = (status: UserAssessmentStatusResponse): boolean =>
  !status.hasProgramme && !status.hasEverHadProgramme && !!status.assessmentFlowId;

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
