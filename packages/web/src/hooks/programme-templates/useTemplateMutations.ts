import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateProgrammeTemplateInput,
  TemplateDetailResponse,
  UpdateProgrammeTemplateInput,
} from '@ffp/core';

import { adminProgrammeTemplatesApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateTemplateVariables {
  id: string;
  data: UpdateProgrammeTemplateInput;
}

/** Mutation hook for creating a programme template. */
export const useCreateTemplateMutation = (): UseMutationResult<
  TemplateDetailResponse,
  Error,
  CreateProgrammeTemplateInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProgrammeTemplateInput) => adminProgrammeTemplatesApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: programmeTemplateKeys.lists() });
    },
  });
};

/** Mutation hook for updating a programme template. */
export const useUpdateTemplateMutation = (): UseMutationResult<
  TemplateDetailResponse,
  Error,
  UpdateTemplateVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdateTemplateVariables) =>
      adminProgrammeTemplatesApi.update(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: programmeTemplateKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(variables.id),
      });
    },
  });
};

/** Mutation hook for deactivating a programme template. */
export const useDeactivateTemplateMutation = (): UseMutationResult<
  TemplateDetailResponse,
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminProgrammeTemplatesApi.deactivate(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: programmeTemplateKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: programmeTemplateKeys.detail(id) });
    },
  });
};
