import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { SessionStatusResponse } from '@ffp/core';

import { sessionsApi } from '@web/lib/api';
import { programmeKeys } from '@web/lib/query';

import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

type SkipSessionMutationOptions = Omit<
  UseMutationOptions<SessionStatusResponse, Error, string>,
  'mutationFn'
>;

/**
 * Skip a session.
 *
 * Accepts the session ID as the mutation variable.
 * Invalidates programme detail and progress caches on success.
 */
export const useSkipSessionMutation = (
  options?: SkipSessionMutationOptions
): UseMutationResult<SessionStatusResponse, Error, string> => {
  const queryClient = useQueryClient();

  const { onSuccess: callerOnSuccess, ...restOptions } = options ?? {};

  return useMutation({
    ...restOptions,
    mutationFn: (sessionId: string) => {
      return sessionsApi.skip(sessionId);
    },
    onSuccess: (data, ...args) => {
      void queryClient.invalidateQueries({ queryKey: programmeKeys.activeDetail() });
      void queryClient.invalidateQueries({ queryKey: programmeKeys.activeProgress() });

      callerOnSuccess?.(data, ...args);
    },
  });
};
