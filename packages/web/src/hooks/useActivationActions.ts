import { useCallback, useState } from 'react';

import { useToast } from '@web/hooks/useToast';

import type { UseMutationResult } from '@tanstack/react-query';

interface ActivationTarget {
  publicId: string;
}

export interface ActivationCallbacks {
  onSuccess: () => void;
  onError: (err: Error) => void;
}

interface UseActivationActionsOptions<TTarget extends ActivationTarget> {
  deactivate: Pick<UseMutationResult<void, Error, string>, 'mutate' | 'isPending'>;
  /**
   * Brings a record back into use. A callback rather than the update mutation
   * itself, so each resource keeps its own update variables.
   */
  activate: (publicId: string, callbacks: ActivationCallbacks) => void;
  isActivating: boolean;
  /** Names the record in the toast, e.g. `() => 'Question'`. Keep it stable (module level). */
  describe: (target: TTarget) => string;
  /** Runs once a deactivation lands; the edit page navigates back */
  onDeactivated?: () => void;
}

export interface ActivationActions<TTarget extends ActivationTarget> {
  /** The record awaiting the deactivate confirmation, if any */
  pending: TTarget | null;
  requestDeactivate: (target: TTarget) => void;
  cancelDeactivate: () => void;
  confirmDeactivate: () => void;
  activate: (target: TTarget) => void;
  isDeactivating: boolean;
  isActivating: boolean;
}

/** Deactivate-with-confirmation and activate for a soft-deletable record, with their toasts. */
export const useActivationActions = <TTarget extends ActivationTarget>({
  deactivate,
  activate,
  isActivating,
  describe,
  onDeactivated,
}: UseActivationActionsOptions<TTarget>): ActivationActions<TTarget> => {
  const { addToast } = useToast();
  const [pending, setPending] = useState<TTarget | null>(null);
  const { mutate: mutateDeactivate } = deactivate;

  const cancelDeactivate = useCallback((): void => {
    setPending(null);
  }, []);

  const confirmDeactivate = useCallback((): void => {
    if (!pending) {
      return;
    }

    mutateDeactivate(pending.publicId, {
      onSuccess: () => {
        addToast(`${describe(pending)} deactivated successfully`, { variant: 'success' });
        setPending(null);
        onDeactivated?.();
      },
      onError: (err) => {
        addToast(err.message, { variant: 'error' });
        setPending(null);
      },
    });
  }, [pending, mutateDeactivate, describe, onDeactivated, addToast]);

  const handleActivate = useCallback(
    (target: TTarget): void => {
      activate(target.publicId, {
        onSuccess: () => {
          addToast(`${describe(target)} activated successfully`, { variant: 'success' });
        },
        onError: (err) => {
          addToast(err.message, { variant: 'error' });
        },
      });
    },
    [activate, describe, addToast]
  );

  return {
    pending,
    requestDeactivate: setPending,
    cancelDeactivate,
    confirmDeactivate,
    activate: handleActivate,
    isDeactivating: deactivate.isPending,
    isActivating,
  };
};
