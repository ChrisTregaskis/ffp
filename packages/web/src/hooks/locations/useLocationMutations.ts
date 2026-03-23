import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateLocationResponse,
  LocationDetailResponse,
  UpdateLocationInput,
} from '@ffp/core';

import type { CreateLocationMutationInput } from '@web/lib/api/endpoints';
import { adminLocationsApi } from '@web/lib/api/endpoints';
import { locationKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateLocationVariables {
  id: string;
  data: UpdateLocationInput;
}

/** Mutation hook for creating a location under an organisation. */
export const useCreateLocationMutation = (): UseMutationResult<
  CreateLocationResponse,
  Error,
  CreateLocationMutationInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organisationId, data }: CreateLocationMutationInput) =>
      adminLocationsApi.create(organisationId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
  });
};

/** Mutation hook for updating a location. */
export const useUpdateLocationMutation = (): UseMutationResult<
  LocationDetailResponse,
  Error,
  UpdateLocationVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateLocationVariables) => adminLocationsApi.update(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.id) });
    },
  });
};
