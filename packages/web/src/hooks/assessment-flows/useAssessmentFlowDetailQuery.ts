import { useQuery } from '@tanstack/react-query';

import type { AssessmentFlowWithStepsView } from '@web/lib/api/endpoints';
import { adminAssessmentFlowsApi } from '@web/lib/api/endpoints';
import { assessmentFlowKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** A flow with its ordered active steps, by public identifier. */
export const useAssessmentFlowDetailQuery = (
  publicId: string,
  options?: Omit<UseQueryOptions<AssessmentFlowWithStepsView>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentFlowWithStepsView> => {
  return useQuery({
    queryKey: assessmentFlowKeys.detail(publicId),
    queryFn: () => adminAssessmentFlowsApi.get(publicId),
    enabled: !!publicId,
    staleTime: minutesToMs(2),
    ...options,
  });
};
