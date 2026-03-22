import { useQuery } from '@tanstack/react-query';

import type { PaginationInput } from '@ffp/core';

import type {
  AdminOrganisationFilterInput,
  PaginatedOrganisationResponse,
} from '@web/lib/api/endpoints';
import { adminOrganisationsApi } from '@web/lib/api/endpoints';
import { organisationKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of organisations with search and status filter. */
export const useAdminOrganisationsQuery = (
  pagination: PaginationInput,
  filters: AdminOrganisationFilterInput,
  options?: Omit<UseQueryOptions<PaginatedOrganisationResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedOrganisationResponse> => {
  return useQuery({
    queryKey: organisationKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminOrganisationsApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
