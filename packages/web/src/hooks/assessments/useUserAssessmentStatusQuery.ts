import { useQuery } from '@tanstack/react-query';

import { assessmentsApi } from '@web/lib/api';
import type { UserAssessmentStatusResponse } from '@web/lib/api/endpoints/assessments';
import { assessmentKeys } from '@web/lib/query';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the current user's assessment/programme status
 *
 * Returns whether the user has an active programme and the default
 * assessment flow ID for redirect.
 */
export const useUserAssessmentStatusQuery = (
  options?: Omit<UseQueryOptions<UserAssessmentStatusResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<UserAssessmentStatusResponse> => {
  return useQuery({
    queryKey: assessmentKeys.userStatus(),
    queryFn: ({ signal }) => assessmentsApi.getUserStatus(signal),
    staleTime: 0, // Always fresh — critical for login redirect
    ...options,
  });
};
