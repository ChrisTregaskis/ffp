import { useCallback, useState } from 'react';

import { useToast } from '@web/hooks/useToast';

interface SaveCallbacks<TResult> {
  onSuccess: (result: TResult) => void;
  onError: (err: Error) => void;
}

export interface SaveCallbackOptions {
  /** The submit error a failure shows; defaults to the error's own message */
  mapError?: (err: Error) => string;
}

export interface SaveFeedback {
  /** The last save's failure, for the form's error alert */
  submitError: string | null;
  setSubmitError: (message: string | null) => void;
  clearSubmitError: () => void;
  /**
   * Per-call `mutateAsync` options: a success toast, then `then`; a failure goes
   * to `submitError`. `mutateAsync` still rejects after `onError`, which the
   * guarded form relies on to know the save did not land.
   */
  saveCallbacks: <TResult>(
    message: string | ((result: TResult) => string),
    then?: (result: TResult) => void,
    options?: SaveCallbackOptions
  ) => SaveCallbacks<TResult>;
}

/** The success toast and error message an admin edit page shows around a save. */
export const useSaveFeedback = (): SaveFeedback => {
  const { addToast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearSubmitError = useCallback((): void => {
    setSubmitError(null);
  }, []);

  const saveCallbacks = useCallback(
    <TResult>(
      message: string | ((result: TResult) => string),
      then?: (result: TResult) => void,
      options?: SaveCallbackOptions
    ): SaveCallbacks<TResult> => ({
      onSuccess: (result) => {
        addToast(typeof message === 'function' ? message(result) : message, {
          variant: 'success',
        });
        then?.(result);
      },
      onError: (err) => {
        setSubmitError(options?.mapError ? options.mapError(err) : err.message);
      },
    }),
    [addToast]
  );

  return { submitError, setSubmitError, clearSubmitError, saveCallbacks };
};
