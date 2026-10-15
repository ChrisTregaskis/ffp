import { useCallback, useState } from 'react';

import type { RowAction } from '@web/components/organisms';
import { useToast } from '@web/hooks/useToast';

export interface ActivationCallbacks {
  onSuccess: () => void;
  onError: (err: Error) => void;
}

interface UseActivationActionsOptions<TTarget> {
  /**
   * Takes a record out of use. Both actions are callbacks rather than mutations,
   * so each resource builds its own variables from the record.
   */
  deactivate: (target: TTarget, callbacks: ActivationCallbacks) => void;
  isDeactivating: boolean;
  /** Brings a record back into use */
  activate: (target: TTarget, callbacks: ActivationCallbacks) => void;
  isActivating: boolean;
  /** Names the record in the toast, e.g. `() => 'Question'`. Keep it stable (module level). */
  describe: (target: TTarget) => string;
  /** Runs once a deactivation lands; the edit page navigates back */
  onDeactivated?: () => void;
}

export interface ActivationActions<TTarget> {
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
export const useActivationActions = <TTarget>({
  deactivate,
  isDeactivating,
  activate,
  isActivating,
  describe,
  onDeactivated,
}: UseActivationActionsOptions<TTarget>): ActivationActions<TTarget> => {
  const { addToast } = useToast();
  const [pending, setPending] = useState<TTarget | null>(null);

  const cancelDeactivate = useCallback((): void => {
    setPending(null);
  }, []);

  const confirmDeactivate = useCallback((): void => {
    if (!pending) {
      return;
    }

    deactivate(pending, {
      onSuccess: () => {
        addToast(`${describe(pending)} deactivated successfully`, { variant: 'success' });
        // A record requested while this one was in flight keeps its modal
        setPending((current) => (current === pending ? null : current));
        onDeactivated?.();
      },
      onError: (err) => {
        addToast(err.message, { variant: 'error' });
        setPending((current) => (current === pending ? null : current));
      },
    });
  }, [pending, deactivate, describe, onDeactivated, addToast]);

  const handleActivate = useCallback(
    (target: TTarget): void => {
      activate(target, {
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
    isDeactivating,
    isActivating,
  };
};

/**
 * The list row's Deactivate (asks first) or Activate action. Pass the two
 * callbacks rather than the whole result, which is a new object every render.
 */
export const toActivationRowAction = <TRow>(
  isActive: boolean,
  { requestDeactivate, activate }: Pick<ActivationActions<TRow>, 'requestDeactivate' | 'activate'>
): RowAction<TRow> =>
  isActive
    ? { label: 'Deactivate', onClick: requestDeactivate, variant: 'danger' }
    : { label: 'Activate', onClick: activate };
