import { useMutation, useQueryClient } from '@tanstack/react-query';

import type {
  CreateSlotRequest,
  SessionSlotsResponse,
  SlotResponse,
  UpdateSlotRequest,
} from '@ffp/core';

import { adminSlotsApi } from '@web/lib/api/endpoints';
import { programmeTemplateKeys } from '@web/lib/query/keys';

import type { UseMutationResult } from '@tanstack/react-query';

export interface CreateSlotVariables {
  sessionId: string;
  data: CreateSlotRequest;
}

export interface UpdateSlotVariables {
  publicId: string;
  data: UpdateSlotRequest;
}

export interface DeleteSlotVariables {
  publicId: string;
}

export interface ReorderSlotsVariables {
  sessionId: string;
  orderedIds: string[];
}

/** Slots live only in the per-session query, so its lists are all a slot write affects. */
const useInvalidateSlots = (): (() => void) => {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: programmeTemplateKeys.sessionSlots() });
  };
};

/** Mutation hook for adding a slot to a session. */
export const useCreateSlotMutation = (): UseMutationResult<
  SlotResponse,
  Error,
  CreateSlotVariables
> => {
  const invalidate = useInvalidateSlots();

  return useMutation({
    mutationFn: ({ sessionId, data }: CreateSlotVariables) => adminSlotsApi.create(sessionId, data),
    onSuccess: invalidate,
  });
};

/** Mutation hook for updating a slot. */
export const useUpdateSlotMutation = (): UseMutationResult<
  SlotResponse,
  Error,
  UpdateSlotVariables
> => {
  const invalidate = useInvalidateSlots();

  return useMutation({
    mutationFn: ({ publicId, data }: UpdateSlotVariables) => adminSlotsApi.update(publicId, data),
    onSuccess: invalidate,
  });
};

/** Mutation hook for deleting a slot. */
export const useDeleteSlotMutation = (): UseMutationResult<void, Error, DeleteSlotVariables> => {
  const invalidate = useInvalidateSlots();

  return useMutation({
    mutationFn: ({ publicId }: DeleteSlotVariables) => adminSlotsApi.delete(publicId),
    onSuccess: invalidate,
  });
};

/** Mutation hook for reordering a session's slots. */
export const useReorderSlotsMutation = (): UseMutationResult<
  SessionSlotsResponse,
  Error,
  ReorderSlotsVariables
> => {
  const invalidate = useInvalidateSlots();

  return useMutation({
    mutationFn: ({ sessionId, orderedIds }: ReorderSlotsVariables) =>
      adminSlotsApi.reorder(sessionId, { orderedIds }),
    onSuccess: invalidate,
  });
};
