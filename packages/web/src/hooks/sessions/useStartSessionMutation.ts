import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { StartSessionRequest, StartSessionResponse } from '@ffp/core';

import { sessionsApi } from '@web/lib/api';
import { programmeKeys } from '@web/lib/query';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

type StartSessionMutationOptions = Omit<
  UseMutationOptions<StartSessionResponse, Error, StartSessionRequest>,
  'mutationFn'
>;

/**
 * Start a session — creates user_session + exercise_completions.
 *
 * Idempotent: safe to call multiple times for the same session.
 * Invalidates programme detail cache so session status updates.
 */
export const useStartSessionMutation = (
  options?: StartSessionMutationOptions
): UseMutationResult<StartSessionResponse, Error, StartSessionRequest> => {
  const queryClient = useQueryClient();

  const { onSuccess: callerOnSuccess, ...restOptions } = options ?? {};

  return useMutation({
    ...restOptions,
    mutationFn: (input: StartSessionRequest) => {
      return sessionsApi.start(input);
    },
    onSuccess: (data, ...args) => {
      // Invalidate programme detail so session status reflects
      void queryClient.invalidateQueries({ queryKey: programmeKeys.activeDetail() });

      callerOnSuccess?.(data, ...args);
    },
  });
};
