import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  AssessmentTemplate,
  CreateAssessmentTemplateRequest,
  UpdateAssessmentTemplateInput,
} from '@ffp/core';

import { adminAssessmentTemplatesApi } from '@web/lib/api/endpoints';
import { invalidateListsAndDetail } from '@web/lib/query';
import { assessmentTemplateKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateAssessmentTemplateVariables {
  publicId: string;
  data: UpdateAssessmentTemplateInput;
}

/** Mutation hook for creating an assessment template. */
export const useCreateAssessmentTemplateMutation = (): UseMutationResult<
  AssessmentTemplate,
  Error,
  CreateAssessmentTemplateRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentTemplateRequest) => adminAssessmentTemplatesApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assessmentTemplateKeys.lists() });
    },
  });
};

/** Mutation hook for updating an assessment template's details or status. */
export const useUpdateAssessmentTemplateMutation = (): UseMutationResult<
  AssessmentTemplate,
  Error,
  UpdateAssessmentTemplateVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateAssessmentTemplateVariables) =>
      adminAssessmentTemplatesApi.update(publicId, data),
    onSuccess: (_data, variables) => {
      invalidateListsAndDetail(queryClient, assessmentTemplateKeys, variables);
    },
  });
};

/** Mutation hook for deactivating an assessment template (soft delete). */
export const useDeactivateAssessmentTemplateMutation = (): UseMutationResult<
  void,
  Error,
  string
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => adminAssessmentTemplatesApi.deactivate(publicId),
    onSuccess: (_data, publicId) => {
      invalidateListsAndDetail(queryClient, assessmentTemplateKeys, { publicId });
    },
  });
};
