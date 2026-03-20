import { useQuery } from '@tanstack/react-query';

import type { PaginationInput } from '@ffp/core';

import type { AdminUserFilterInput, PaginatedUserResponse } from '@web/lib/api/endpoints';
import { adminUsersApi } from '@web/lib/api/endpoints';
import { userKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of users with search, customer, and role filters. */
export const useAdminUsersQuery = (
  pagination: PaginationInput,
  filters: AdminUserFilterInput,
  options?: Omit<UseQueryOptions<PaginatedUserResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedUserResponse> => {
  return useQuery({
    queryKey: userKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminUsersApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
