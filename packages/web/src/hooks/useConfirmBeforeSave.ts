import { useCallback, useRef, useState } from 'react';

/** A save awaiting confirmation, with the settlers of the promise the form is awaiting */
interface PendingSave<TPayload> {
  payload: TPayload;
  resolve: () => void;
  reject: (reason: Error) => void;
}

export interface ConfirmBeforeSave<TPayload> {
  /** Whether the confirmation modal should show */
  isConfirmOpen: boolean;
  /**
   * Opens the modal and returns a promise the modal settles: it resolves once the confirmed
   * save lands and rejects on cancel or a failed save, so an opened modal never reads as a
   * landed save and a cancel leaves the form's edits in place.
   */
  requestConfirm: (payload: TPayload) => Promise<void>;
  /** The modal's confirm: runs the save */
  confirm: () => void;
  /** The modal's cancel or close: nothing is sent */
  cancel: () => void;
}

/** Holds a save behind a confirmation modal until the user confirms or cancels it. */
export const useConfirmBeforeSave = <TPayload>(
  save: (payload: TPayload) => Promise<void>
): ConfirmBeforeSave<TPayload> => {
  const pendingRef = useRef<PendingSave<TPayload> | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const requestConfirm = useCallback(
    (payload: TPayload): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        pendingRef.current = { payload, resolve, reject };
        setIsConfirmOpen(true);
      }),
    []
  );

  // Taken rather than read, so a click landing during the modal's exit animation settles nothing
  const takePending = useCallback((): PendingSave<TPayload> | null => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setIsConfirmOpen(false);

    return pending;
  }, []);

  const confirm = useCallback((): void => {
    const pending = takePending();

    if (pending) {
      save(pending.payload).then(pending.resolve, pending.reject);
    }
  }, [takePending, save]);

  const cancel = useCallback((): void => {
    takePending()?.reject(new Error('Save cancelled'));
  }, [takePending]);

  return { isConfirmOpen, requestConfirm, confirm, cancel };
};
