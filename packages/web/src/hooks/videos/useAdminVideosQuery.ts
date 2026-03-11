import { useQuery } from '@tanstack/react-query';

import type { AdminVideoFilterInput, PaginationInput } from '@ffp/core';

import { adminVideosApi } from '@web/lib/api';
import type { PaginatedAdminVideoResponse } from '@web/lib/api';
import { videoKeys } from '@web/lib/query';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches the admin video list with pagination, search, and filters.
 *
 * Uses debounced values from `useApiTable` for the query key and API call
 * to prevent excessive re-fetches during typing/filtering.
 */
export const useAdminVideosQuery = (
  pagination: PaginationInput,
  filters: AdminVideoFilterInput,
  options?: Omit<UseQueryOptions<PaginatedAdminVideoResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedAdminVideoResponse> => {
  return useQuery({
    queryKey: videoKeys.adminList({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminVideosApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
