import { useQuery } from '@tanstack/react-query';

import type { OrganisationDetailResponse } from '@ffp/core';

import { adminOrganisationsApi } from '@web/lib/api/endpoints';
import { organisationKeys } from '@web/lib/query/keys';
import { minutesToMs } from '@web/utils/time';

import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single organisation by ID for the edit page. */
export const useOrganisationDetailQuery = (
  organisationId: string,
  options?: Omit<UseQueryOptions<OrganisationDetailResponse>, 'queryKey' | 'queryFn'>
): UseQueryResult<OrganisationDetailResponse> => {
  return useQuery({
    queryKey: organisationKeys.detail(organisationId),
    queryFn: () => adminOrganisationsApi.get(organisationId),
    staleTime: minutesToMs(2),
    enabled: !!organisationId,
    ...options,
  });
};
