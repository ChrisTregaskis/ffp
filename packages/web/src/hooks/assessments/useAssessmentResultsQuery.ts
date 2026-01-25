import { useQuery } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { AssessmentResultsResponse } from '@web/lib/api/endpoints/assessments';
import { assessmentKeys } from '@web/lib/query';
import { secondsToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Polling interval while results are processing */
const POLLING_INTERVAL_MS = secondsToMs(2);

/**
 * Fetch assessment results with polling
 *
 * Polls the results endpoint every 2 seconds while the assessment
 * is still being scored. Automatically stops polling once:
 * - Status is 'scored' or 'completed'
 * - Scores exist in the response
 * - Persistent errors occur
 */
export const useAssessmentResultsQuery = (
  assessmentId: string,
  options?: Omit<UseQueryOptions<AssessmentResultsResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<AssessmentResultsResponse> => {
  return useQuery({
    queryKey: assessmentKeys.results(assessmentId),
    queryFn: ({ signal }) => assessmentsApi.getResults(assessmentId, signal),
    enabled: !!assessmentId,
    // Poll every 2 seconds while processing, stop when complete or on persistent error
    refetchInterval: (query) => {
      const data = query.state.data;

      // Stop polling if scoring is complete
      if (data?.status === 'scored' || data?.status === 'completed' || data?.scores) {
        return false;
      }

      // Stop polling if we've had persistent errors (idle means not currently fetching)
      if (query.state.fetchStatus === 'idle' && query.state.status === 'error') {
        return false;
      }

      return POLLING_INTERVAL_MS;
    },
    ...options,
  });
};
