import { useQuery } from '@tanstack/react-query';

import type { PaginationInput } from '@ffp/core';

import type {
  AdminAssessmentTemplateFilterInput,
  PaginatedAssessmentTemplateList,
} from '@web/lib/api/endpoints';
import { adminAssessmentTemplatesApi } from '@web/lib/api/endpoints';
import { assessmentTemplateKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of assessment templates with search and filters. */
export const useAdminAssessmentTemplatesQuery = (
  pagination: PaginationInput,
  filters: AdminAssessmentTemplateFilterInput,
  options?: Omit<UseQueryOptions<PaginatedAssessmentTemplateList>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedAssessmentTemplateList> => {
  return useQuery({
    queryKey: assessmentTemplateKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminAssessmentTemplatesApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
