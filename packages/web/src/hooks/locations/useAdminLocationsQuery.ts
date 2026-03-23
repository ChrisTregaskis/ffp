import { useQuery } from '@tanstack/react-query';

import type { PaginationInput } from '@ffp/core';

import type { AdminLocationFilterInput, PaginatedLocationResponse } from '@web/lib/api/endpoints';
import { adminLocationsApi } from '@web/lib/api/endpoints';
import { locationKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of locations with search, status, and organisation filter. */
export const useAdminLocationsQuery = (
  pagination: PaginationInput,
  filters: AdminLocationFilterInput,
  options?: Omit<UseQueryOptions<PaginatedLocationResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedLocationResponse> => {
  return useQuery({
    queryKey: locationKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminLocationsApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
