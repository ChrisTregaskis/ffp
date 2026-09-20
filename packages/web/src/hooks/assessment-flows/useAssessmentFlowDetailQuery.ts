import { useQuery } from '@tanstack/react-query';

import type { AssessmentFlowMetadata } from '@web/lib/api/endpoints';
import { adminAssessmentFlowsApi } from '@web/lib/api/endpoints';
import { assessmentFlowKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single assessment flow's metadata by public identifier. */
export const useAssessmentFlowDetailQuery = (
  publicId: string,
  options?: Omit<UseQueryOptions<AssessmentFlowMetadata>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentFlowMetadata> => {
  return useQuery({
    queryKey: assessmentFlowKeys.detail(publicId),
    queryFn: () => adminAssessmentFlowsApi.get(publicId),
    enabled: !!publicId,
    staleTime: minutesToMs(2),
    ...options,
  });
};
