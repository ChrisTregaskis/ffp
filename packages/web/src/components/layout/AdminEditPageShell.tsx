import { useCallback, useMemo } from 'react';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';

import { ContentPanel } from './ContentPanel';
import { PageContainer } from './PageContainer';
import { PageHeader } from './PageHeader';

import type { ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';

export interface AdminEditPageShellProps<TFormValues extends FieldValues, TRecord> {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  /** Singular, lower case — "location" */
  resourceLabel: string;
  /** Plural, title case — "Locations" */
  listLabel: string;
  /** Editing waits for a record; creating has nothing to wait for */
  isEditMode: boolean;
  isLoading: boolean;
  loadError?: Error | null;
  /** Replaces the error's own message */
  loadErrorMessage?: string;
  onBack: () => void;
  /** The fetched record; the form re-seeds from it when a refetch changes it */
  record: TRecord | undefined;
  /** Seeds a create form. Define it and `toFormValues` at module level so the values memo holds. */
  emptyValues: TFormValues;
  toFormValues: (record: TRecord) => TFormValues;
  /** Each returns the save's promise (`mutateAsync`, not `mutate`) so the form knows when it lands */
  onCreate: (values: TFormValues) => Promise<void>;
  onUpdate: (values: TFormValues) => Promise<void>;
  /** The form's field components */
  children: ReactNode;
  /** Rendered after the panel — modals and the like */
  footer?: ReactNode;
}

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
  isEditMode,
  isLoading,
  loadError,
  loadErrorMessage,
  onBack,
  record,
  emptyValues,
  toFormValues,
  onCreate,
  onUpdate,
  children,
  footer,
}: AdminEditPageShellProps<TFormValues, TRecord>): JSX.Element => {
  const isAwaitingRecord = isEditMode && (isLoading || !!loadError);

  const values = useMemo(
    (): TFormValues => (isEditMode && record ? toFormValues(record) : emptyValues),
    [isEditMode, record, toFormValues, emptyValues]
  );

  const handleSubmit = useCallback(
    (formValues: TFormValues): Promise<void> =>
      isEditMode ? onUpdate(formValues) : onCreate(formValues),
    [isEditMode, onUpdate, onCreate]
  );

  return (
    <PageContainer>
      <PageHeader title={title} subtitle={subtitle} actions={headerActions} />

      <ContentPanel>
        {isAwaitingRecord ? (
          <PageState
            isLoading={isLoading}
            title={`Unable to load ${resourceLabel}`}
            message={loadErrorMessage ?? loadError?.message}
            actionLabel={`Back to ${listLabel}`}
            onAction={onBack}
          />
        ) : (
          <ComposableForm<TFormValues> onSubmit={handleSubmit} values={values} guardUnsavedChanges>
            {children}
          </ComposableForm>
        )}
      </ContentPanel>

      {footer}
    </PageContainer>
  );
};
