import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreatePhaseRequest, PhaseResponse, UpdatePhaseRequest } from '@ffp/core';

import { adminPhasesApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface CreatePhaseVariables {
  templateId: string;
  data: CreatePhaseRequest;
}

export interface UpdatePhaseVariables {
  phaseId: string;
  data: UpdatePhaseRequest;
}

export interface DeletePhaseVariables {
  phaseId: string;
  templateId: string;
}

export interface ReorderPhasesVariables {
  templateId: string;
  orderedIds: string[];
}

/** Mutation hook for creating a phase within a programme template. */
export const useCreatePhaseMutation = (
  templateId: string
): UseMutationResult<PhaseResponse, Error, CreatePhaseVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId: tId, data }: CreatePhaseVariables) =>
      adminPhasesApi.create(tId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};

/** Mutation hook for updating a phase. */
export const useUpdatePhaseMutation = (
  templateId: string
): UseMutationResult<PhaseResponse, Error, UpdatePhaseVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phaseId, data }: UpdatePhaseVariables) => adminPhasesApi.update(phaseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};

/** Mutation hook for deleting a phase. */
export const useDeletePhaseMutation = (
  templateId: string
): UseMutationResult<void, Error, DeletePhaseVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phaseId }: DeletePhaseVariables) => adminPhasesApi.delete(phaseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};

/** Mutation hook for reordering phases within a programme template. */
export const useReorderPhasesMutation = (
  templateId: string
): UseMutationResult<PhaseResponse[], Error, ReorderPhasesVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId: tId, orderedIds }: ReorderPhasesVariables) =>
      adminPhasesApi.reorder(tId, { orderedIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};
