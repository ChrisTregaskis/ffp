import { useQuery } from '@tanstack/react-query';

import type { PaginationInput } from '@ffp/core';

import type { AdminCustomerFilterInput, PaginatedCustomerResponse } from '@web/lib/api/endpoints';
import { adminCustomersApi } from '@web/lib/api/endpoints';
import { customerKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a paginated list of customers with search and status filter. */
export const useAdminCustomersQuery = (
  pagination: PaginationInput,
  filters: AdminCustomerFilterInput,
  options?: Omit<UseQueryOptions<PaginatedCustomerResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<PaginatedCustomerResponse> => {
  return useQuery({
    queryKey: customerKeys.list({ ...pagination, ...filters }),
    queryFn: ({ signal }) => adminCustomersApi.list(pagination, filters, signal),
    staleTime: minutesToMs(2),
    ...options,
  });
};
