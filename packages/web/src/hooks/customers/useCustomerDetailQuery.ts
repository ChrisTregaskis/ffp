import { useQuery } from '@tanstack/react-query';

import type { CustomerDetailResponse } from '@ffp/core';

import { adminCustomersApi } from '@web/lib/api/endpoints';
import { customerKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single customer by ID for the edit page. */
export const useCustomerDetailQuery = (
  customerId: string,
  options?: Omit<UseQueryOptions<CustomerDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<CustomerDetailResponse> => {
  return useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => adminCustomersApi.get(customerId),
    staleTime: minutesToMs(2),
    enabled: !!customerId,
    ...options,
  });
};
