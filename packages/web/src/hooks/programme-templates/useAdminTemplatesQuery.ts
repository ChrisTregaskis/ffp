import { useQuery } from '@tanstack/react-query';

import type { PaginationInput } from '@ffp/core';

import type {
  AdminTemplateFilterInput,
  PaginatedTemplateListResponse,
} from '@web/lib/api/endpoints';
import { adminProgrammeTemplatesApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of programme templates with search and filters. */
export const useAdminTemplatesQuery = (
  pagination: PaginationInput,
  filters: AdminTemplateFilterInput,
  options?: Omit<UseQueryOptions<PaginatedTemplateListResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedTemplateListResponse> => {
  return useQuery({
    queryKey: programmeTemplateKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminProgrammeTemplatesApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
