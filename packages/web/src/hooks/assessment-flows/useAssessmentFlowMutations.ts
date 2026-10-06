import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateAssessmentFlowInput, UpdateAssessmentFlowInput } from '@ffp/core';

import type { AssessmentFlowMetadata } from '@web/lib/api/endpoints';
import { adminAssessmentFlowsApi } from '@web/lib/api/endpoints';
import { invalidateListsAndDetail } from '@web/lib/query';
import { assessmentFlowKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateAssessmentFlowVariables {
  publicId: string;
  data: UpdateAssessmentFlowInput;
}

/** Mutation hook for creating an assessment flow. */
export const useCreateAssessmentFlowMutation = (): UseMutationResult<
  AssessmentFlowMetadata,
  Error,
  CreateAssessmentFlowInput
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssessmentFlowInput) => adminAssessmentFlowsApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assessmentFlowKeys.lists() });
    },
  });
};

/** Mutation hook for updating an assessment flow's metadata. */
export const useUpdateAssessmentFlowMutation = (): UseMutationResult<
  AssessmentFlowMetadata,
  Error,
  UpdateAssessmentFlowVariables
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateAssessmentFlowVariables) =>
      adminAssessmentFlowsApi.update(publicId, data),
    onSuccess: (_data, variables) => {
      invalidateListsAndDetail(queryClient, assessmentFlowKeys, variables);
    },
  });
};

/** Mutation hook for deactivating an assessment flow (soft delete). */
export const useDeactivateAssessmentFlowMutation = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (publicId: string) => adminAssessmentFlowsApi.deactivate(publicId),
    onSuccess: (_data, publicId) => {
      invalidateListsAndDetail(queryClient, assessmentFlowKeys, { publicId });
    },
  });
};
