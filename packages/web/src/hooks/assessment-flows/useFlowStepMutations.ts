import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { AdminFlowStepView, CreateFlowStepInput, UpdateFlowStepInput } from '@ffp/core';

import { adminFlowStepsApi } from '@web/lib/api/endpoints';
import { assessmentFlowKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface UpdateFlowStepVariables {
  stepPublicId: string;
  data: UpdateFlowStepInput;
}

export interface DeleteFlowStepVariables {
  stepPublicId: string;
}

export interface ReorderFlowStepsVariables {
  orderedStepPublicIds: string[];
}

/** Detail serves both the metadata form and the step list; a list row carries a step count. */
const useStepCacheInvalidation = (flowPublicId: string): (() => void) => {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: assessmentFlowKeys.detail(flowPublicId) });
    void queryClient.invalidateQueries({ queryKey: assessmentFlowKeys.lists() });
  };
};

/** Appends a step — the server assigns its order. */
export const useCreateFlowStepMutation = (
  flowPublicId: string
): UseMutationResult<AdminFlowStepView, Error, CreateFlowStepInput> => {
  const invalidate = useStepCacheInvalidation(flowPublicId);

  return useMutation({
    mutationFn: (data: CreateFlowStepInput) => adminFlowStepsApi.create(flowPublicId, data),
    onSuccess: invalidate,
  });
};

export const useUpdateFlowStepMutation = (
  flowPublicId: string
): UseMutationResult<AdminFlowStepView, Error, UpdateFlowStepVariables> => {
  const invalidate = useStepCacheInvalidation(flowPublicId);

  return useMutation({
    mutationFn: ({ stepPublicId, data }: UpdateFlowStepVariables) =>
      adminFlowStepsApi.update(flowPublicId, stepPublicId, data),
    onSuccess: invalidate,
  });
};

/** Soft delete — the row is kept. */
export const useDeleteFlowStepMutation = (
  flowPublicId: string
): UseMutationResult<void, Error, DeleteFlowStepVariables> => {
  const invalidate = useStepCacheInvalidation(flowPublicId);

  return useMutation({
    mutationFn: ({ stepPublicId }: DeleteFlowStepVariables) =>
      adminFlowStepsApi.delete(flowPublicId, stepPublicId),
    onSuccess: invalidate,
  });
};

/** Refused with 409 when the flow branches. */
export const useReorderFlowStepsMutation = (
  flowPublicId: string
): UseMutationResult<AdminFlowStepView[], Error, ReorderFlowStepsVariables> => {
  const invalidate = useStepCacheInvalidation(flowPublicId);

  return useMutation({
    mutationFn: ({ orderedStepPublicIds }: ReorderFlowStepsVariables) =>
      adminFlowStepsApi.reorder(flowPublicId, { orderedStepPublicIds }),
    onSuccess: invalidate,
  });
};
