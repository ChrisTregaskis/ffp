import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CreateSessionRequest, SessionResponse, UpdateSessionRequest } from '@ffp/core';

import { adminSessionsApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface CreateSessionVariables {
  phaseId: string;
  data: CreateSessionRequest;
}

export interface UpdateSessionVariables {
  sessionId: string;
  data: UpdateSessionRequest;
}

export interface DeleteSessionVariables {
  sessionId: string;
}

export interface ReorderSessionsVariables {
  phaseId: string;
  orderedIds: string[];
}

/** Mutation hook for creating a session within a phase. */
export const useCreateSessionMutation = (
  templateId: string
): UseMutationResult<SessionResponse, Error, CreateSessionVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phaseId, data }: CreateSessionVariables) =>
      adminSessionsApi.create(phaseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};

/** Mutation hook for updating a session. */
export const useUpdateSessionMutation = (
  templateId: string
): UseMutationResult<SessionResponse, Error, UpdateSessionVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: UpdateSessionVariables) =>
      adminSessionsApi.update(sessionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};

/** Mutation hook for deleting a session. */
export const useDeleteSessionMutation = (
  templateId: string
): UseMutationResult<void, Error, DeleteSessionVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId }: DeleteSessionVariables) => adminSessionsApi.delete(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};

/** Mutation hook for reordering sessions within a phase. */
export const useReorderSessionsMutation = (
  templateId: string
): UseMutationResult<SessionResponse[], Error, ReorderSessionsVariables> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ phaseId, orderedIds }: ReorderSessionsVariables) =>
      adminSessionsApi.reorder(phaseId, { orderedIds }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: programmeTemplateKeys.detail(templateId),
      });
    },
  });
};
