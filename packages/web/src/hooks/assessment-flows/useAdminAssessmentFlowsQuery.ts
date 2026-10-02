import { useQuery } from '@tanstack/react-query';

import type { PaginationInput } from '@ffp/core';

import type {
  AdminAssessmentFlowFilterInput,
  PaginatedAssessmentFlowList,
} from '@web/lib/api/endpoints';
import { adminAssessmentFlowsApi } from '@web/lib/api/endpoints';
import { assessmentFlowKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of assessment flows with search and filters. */
export const useAdminAssessmentFlowsQuery = (
  pagination: PaginationInput,
  filters: AdminAssessmentFlowFilterInput,
  options?: Omit<UseQueryOptions<PaginatedAssessmentFlowList>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedAssessmentFlowList> => {
  return useQuery({
    queryKey: assessmentFlowKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminAssessmentFlowsApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
