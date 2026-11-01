import { useCallback, useMemo } from 'react';

import { ContentPanel, PageContainer } from '@web/components/atoms';
import { PageState, PageHeader } from '@web/components/molecules';
import { ComposableForm } from '@web/components/organisms';

import { useConfirmBeforeSave } from './useConfirmBeforeSave';

import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';

interface AdminEditPageShellBaseProps<TFormValues extends FieldValues, TRecord> {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  /** Singular, lower case — "location" */
  resourceLabel: string;
  /** Plural, title case — "Locations" */
  listLabel: string;
  isLoading: boolean;
  loadError?: Error | null;
  /** Replaces the error's own message */
  loadErrorMessage?: string;
  onBack: () => void;
  /** The fetched record; the form re-seeds from it when a refetch changes it */
  record: TRecord | undefined;
  /** Define it at module level so the values memo holds */
  toFormValues: (record: TRecord) => TFormValues;
  /** Returns the save's promise (`mutateAsync`) so the form knows when it lands */
  onUpdate: (values: TFormValues) => Promise<void>;
  /** Holds an edit behind a modal until the user confirms it */
  confirmBeforeSave?: ConfirmBeforeSaveOption<TFormValues, TRecord>;
  /** Content above the form, outside it; shown only once the form is */
  beforeForm?: ReactNode;
  /** The form's field components */
  children: ReactNode;
  /** Rendered after the panel — modals and the like */
  footer?: ReactNode;
}

export interface ConfirmBeforeSaveModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export interface ConfirmBeforeSaveOption<TFormValues extends FieldValues, TRecord> {
  /** Whether this edit waits for the modal; judge it on the payload the save would send */
  when: (values: TFormValues, record: TRecord) => boolean;
  renderModal: (props: ConfirmBeforeSaveModalProps) => ReactNode;
}

interface CreateOrEditProps<TFormValues extends FieldValues> {
  /** Editing waits for a record; creating has nothing to wait for */
  isEditMode: boolean;
  /** Seeds a create form. Define it at module level so the values memo holds. */
  emptyValues: TFormValues;
  /** Returns the save's promise, as `onUpdate` does */
  onCreate: (values: TFormValues) => Promise<void>;
}

/** A page that only edits leaves out all three create props */
interface EditOnlyProps {
  isEditMode?: never;
  emptyValues?: never;
  onCreate?: never;
}

export type AdminEditPageShellProps<
  TFormValues extends FieldValues,
  TRecord,
> = AdminEditPageShellBaseProps<TFormValues, TRecord> &
  (CreateOrEditProps<TFormValues> | EditOnlyProps);

/**
 * Page frame shared by the admin create/edit screens.
 *
 * The form must not mount before the record arrives: anything typed into the
 * empty placeholder values would count as an edit and survive the re-seed, to be
 * saved over the real record. That condition is derived here rather than passed
 * in, because it is an invariant, not a caller's choice.
 */
export const AdminEditPageShell = <TFormValues extends FieldValues, TRecord>({
  title,
  subtitle,
  headerActions,
  resourceLabel,
  listLabel,
  isEditMode = true,
  isLoading,
  loadError,
  loadErrorMessage,
  onBack,
  record,
  emptyValues,
  toFormValues,
  onCreate,
  onUpdate,
  confirmBeforeSave,
  beforeForm,
  children,
  footer,
}: AdminEditPageShellProps<TFormValues, TRecord>): JSX.Element => {
  // A record in hand keeps the form, and the user's edits, even if a later refetch fails
  const isAwaitingRecord = isEditMode && !record;

  const values = useMemo(
    (): TFormValues | undefined => (isEditMode && record ? toFormValues(record) : emptyValues),
    [isEditMode, record, toFormValues, emptyValues]
  );

  const confirm = useConfirmBeforeSave(onUpdate);
  const { requestConfirm } = confirm;
  const needsConfirm = confirmBeforeSave?.when;

  const handleSubmit = useCallback(
    (formValues: TFormValues): Promise<void> => {
      if (!isEditMode && onCreate) {
        return onCreate(formValues);
      }

      // The modal settles the promise, so a cancel leaves the form's edits in place. A confirm
      // re-runs onUpdate, so the diff is taken against the record as it is at confirm time.
      return record && needsConfirm?.(formValues, record)
        ? requestConfirm(formValues)
        : onUpdate(formValues);
    },
    [isEditMode, onCreate, onUpdate, record, needsConfirm, requestConfirm]
  );

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={subtitle} actions={headerActions} />

      <ContentPanel>
        {isAwaitingRecord ? (
          <PageState
            // A record still missing without an error is on its way
            isLoading={isLoading || !loadError}
            title={`Unable to load ${resourceLabel}`}
            message={loadErrorMessage ?? loadError?.message}
            actionLabel={`Back to ${listLabel}`}
            onAction={onBack}
          />
        ) : (
          <>
            {beforeForm}
            <ComposableForm<TFormValues>
              onSubmit={handleSubmit}
              values={values}
              guardUnsavedChanges
            >
              {children}
            </ComposableForm>
          </>
        )}
      </ContentPanel>

      {confirmBeforeSave?.renderModal({
        isOpen: confirm.isConfirmOpen,
        onConfirm: confirm.confirm,
        onClose: confirm.cancel,
      })}
      {footer}
    </PageContainer>
  );
};
