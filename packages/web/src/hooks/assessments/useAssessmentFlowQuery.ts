import { useQuery } from '@tanstack/react-query';

import type { AssessmentFlow } from '@ffp/core';

import { assessmentsApi } from '@web/lib/api';
import { assessmentKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch assessment flow by ID
 *
 * Fetches the assessment flow configuration including steps,
 * questions, and navigation rules.
 */
export const useAssessmentFlowQuery = (
  flowId: string,
  options?: Omit<UseQueryOptions<AssessmentFlow>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentFlow> => {
  return useQuery({
    queryKey: assessmentKeys.flow(flowId),
    queryFn: ({ signal }) => assessmentsApi.getFlow(flowId, signal),
    staleTime: minutesToMs(5),
    enabled: !!flowId,
    ...options,
  });
};
