import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateOrganisationInput,
  CreateOrganisationResponse,
  OrganisationDetailResponse,
  UpdateOrganisationInput,
} from '@ffp/core';

import type { SplitIdentifierVariables } from '@web/lib/api/client';
import { adminOrganisationsApi } from '@web/lib/api/endpoints';
import { invalidateListsAndDetail } from '@web/lib/query';
import { organisationKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export type UpdateOrganisationVariables = SplitIdentifierVariables<UpdateOrganisationInput>;

/** Mutation hook for creating an organisation. */
export const useCreateOrganisationMutation = (): UseMutationResult<
  CreateOrganisationResponse,
  Error,
  CreateOrganisationInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganisationInput) => adminOrganisationsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: organisationKeys.lists() });
    },
  });
};

/** Mutation hook for updating an organisation. */
export const useUpdateOrganisationMutation = (): UseMutationResult<
  OrganisationDetailResponse,
  Error,
  UpdateOrganisationVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateOrganisationVariables) =>
      adminOrganisationsApi.update(id, data),
    onSuccess: (_data, variables) => {
      invalidateListsAndDetail(queryClient, organisationKeys, variables);
    },
  });
};
