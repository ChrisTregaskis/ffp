import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateCustomerInput,
  CreateCustomerResponse,
  CustomerDetailResponse,
  UpdateCustomerInput,
} from '@ffp/core';

import { adminCustomersApi } from '@web/lib/api/endpoints';
import { customerKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateCustomerVariables {
  id: string;
  data: UpdateCustomerInput;
}

/** Mutation hook for creating a customer. */
export const useCreateCustomerMutation = (): UseMutationResult<
  CreateCustomerResponse,
  Error,
  CreateCustomerInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => adminCustomersApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
};

/** Mutation hook for updating a customer. */
export const useUpdateCustomerMutation = (): UseMutationResult<
  CustomerDetailResponse,
  Error,
  UpdateCustomerVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateCustomerVariables) => adminCustomersApi.update(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    },
  });
};
