import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminCreateUserInput, AdminUpdateUserInput, UserDetailResponse } from '@ffp/core';

import { adminUsersApi } from '@web/lib/api/endpoints';
import { userKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateUserVariables {
  id: string;
  data: AdminUpdateUserInput;
}

/** Mutation hook for creating a programme user. */
export const useCreateUserMutation = (): UseMutationResult<
  UserDetailResponse,
  Error,
  AdminCreateUserInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AdminCreateUserInput) => adminUsersApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

/** Mutation hook for updating a programme user. */
export const useUpdateUserMutation = (): UseMutationResult<
  UserDetailResponse,
  Error,
  UpdateUserVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateUserVariables) => adminUsersApi.update(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
};
