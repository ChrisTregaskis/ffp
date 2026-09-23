import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';

import { ContentPanel } from './ContentPanel';
import { PageContainer } from './PageContainer';
import { PageHeader } from './PageHeader';

import type { ReactNode } from 'react';
import type { DefaultValues, FieldValues, SubmitHandler } from 'react-hook-form';

export interface AdminEditPageShellProps<TFormValues extends FieldValues> {
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
  defaultValues: DefaultValues<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
  /** The form's field components */
  children: ReactNode;
  /** Rendered after the panel — modals and the like */
  footer?: ReactNode;
}

/**
 * Page frame shared by the admin create/edit screens.
 *
 * The form must not mount before the record arrives: `ComposableForm` reads
 * `defaultValues` once, on mount, so a form mounted mid-fetch keeps the empty
 * ones and saves them over a real record. That condition is derived here rather
 * than passed in, because it is an invariant, not a caller's choice.
 */
export const AdminEditPageShell = <TFormValues extends FieldValues>({
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
  defaultValues,
  onSubmit,
  children,
  footer,
}: AdminEditPageShellProps<TFormValues>): JSX.Element => {
  const isAwaitingRecord = isEditMode && (isLoading || !!loadError);

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
          <ComposableForm<TFormValues> onSubmit={onSubmit} defaultValues={defaultValues}>
            {children}
          </ComposableForm>
        )}
      </ContentPanel>

      {footer}
    </PageContainer>
  );
};
