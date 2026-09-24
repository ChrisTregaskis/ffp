import { useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormProvider } from './FormContext';
import { UnsavedChangesGuard } from './UnsavedChangesGuard';

import type { ReactNode } from 'react';
import type { DefaultValues, FieldValues, SubmitHandler } from 'react-hook-form';

export interface ComposableFormProps<TFieldValues extends FieldValues> {
  /** Return the save's promise so the form knows whether it landed */
  onSubmit: SubmitHandler<TFieldValues>;
  /** Initial values for a form with nothing to re-seed from, such as a create form */
  defaultValues?: DefaultValues<TFieldValues>;
  /** Query-seeded values; re-seeds on change, keeping fields the user has edited */
  values?: TFieldValues;
  /** Form content — use standard form field components inside */
  children: ReactNode;
  /** Additional class names for the <form> element */
  className?: string;
  /** Ask before an in-app navigation discards unsaved edits. Needs the data router. */
  guardUnsavedChanges?: boolean;
}

/**
 * Composition-based form wrapper for bespoke form layouts.
 *
 * Wraps `useForm` from react-hook-form and provides context to child
 * field components via `useComposableFormContext()`.
 */
export const ComposableForm = <TFieldValues extends FieldValues>({
  onSubmit,
  defaultValues,
  values,
  children,
  className,
  guardUnsavedChanges = false,
}: ComposableFormProps<TFieldValues>): JSX.Element => {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TFieldValues>({
    defaultValues,
    values,
    // Without this a background refetch mid-edit would discard what the user has typed
    resetOptions: { keepDirtyValues: true },
  });

  // Refs, not state: the guard reads them when a navigation fires, which for a save's
  // own success navigation is before any re-render
  const isCallingSubmitRef = useRef(false);
  const isSavingRef = useRef(false);
  const heldDuringSaveRef = useRef(false);
  const [releaseHeld, setReleaseHeld] = useState(false);

  const submitAndSettle = useCallback<SubmitHandler<TFieldValues>>(
    async (data, event) => {
      let pending: unknown;
      isSavingRef.current = true;

      try {
        isCallingSubmitRef.current = true;

        try {
          pending = onSubmit(data, event);
        } finally {
          isCallingSubmitRef.current = false;
        }

        // Only a returned promise says when the save has landed
        if (!(pending instanceof Promise)) {
          return;
        }

        try {
          await pending;
        } catch {
          // The caller reports its own failure; any navigation held meanwhile now asks
          return;
        }

        // Current values rather than the submitted ones, which would undo a re-seed that
        // landed during the save
        reset(getValues());

        if (heldDuringSaveRef.current) {
          setReleaseHeld(true);
        }
      } finally {
        isSavingRef.current = false;
        heldDuringSaveRef.current = false;
      }
    },
    [onSubmit, reset, getValues]
  );

  const handleReleased = useCallback((): void => {
    setReleaseHeld(false);
  }, []);

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      void handleSubmit(submitAndSettle)(e);
    },
    [handleSubmit, submitAndSettle]
  );

  // A handler navigating during its synchronous call is a deliberate exit; one navigating
  // while its save is in flight is held until the outcome is known
  const shouldBlockNavigation = useCallback((): boolean => {
    if (!isDirty || isCallingSubmitRef.current) {
      return false;
    }

    if (isSavingRef.current) {
      heldDuringSaveRef.current = true;
    }

    return true;
  }, [isDirty]);

  // Generic context requires type erasure; consumer restores type via useComposableFormContext<T>()
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
  const contextValue = {
    register,
    control,
    errors,
    handleSubmit,
    isSubmitting,
    setValue,
    watch,
    getValues,
  } as any;
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */

  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    <FormProvider value={contextValue}>
      <form onSubmit={handleFormSubmit} className={className}>
        {children}
        {guardUnsavedChanges && (
          <UnsavedChangesGuard
            shouldBlock={shouldBlockNavigation}
            isSaving={isSubmitting}
            releaseHeld={releaseHeld}
            onReleased={handleReleased}
          />
        )}
      </form>
    </FormProvider>
  );
};
