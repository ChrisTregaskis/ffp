import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateProgrammeTemplateInput,
  TemplateDetailResponse,
  UpdateProgrammeTemplateInput,
} from '@ffp/core';

import type { SplitIdentifierVariables } from '@web/lib/api/client';
import { adminProgrammeTemplatesApi } from '@web/lib/api/endpoints';
import { invalidateListsAndDetail } from '@web/lib/query';
import { programmeTemplateKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export type UpdateTemplateVariables = SplitIdentifierVariables<UpdateProgrammeTemplateInput>;

/** Deactivate carries no body, but the same two identifiers as an update. */
export type DeactivateTemplateVariables = Omit<SplitIdentifierVariables<never>, 'data'>;

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
      invalidateListsAndDetail(queryClient, programmeTemplateKeys, variables);
    },
  });
};

/** Mutation hook for deactivating a programme template. */
export const useDeactivateTemplateMutation = (): UseMutationResult<
  TemplateDetailResponse,
  Error,
  DeactivateTemplateVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeactivateTemplateVariables) => adminProgrammeTemplatesApi.deactivate(id),
    onSuccess: (_data, variables) => {
      invalidateListsAndDetail(queryClient, programmeTemplateKeys, variables);
    },
  });
};
