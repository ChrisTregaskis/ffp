import React from 'react';

import { StaticAlert, FormActions, FormSelect, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { STATUS_FILTER_OPTIONS } from '@web/pages/protected/admin/organisation-list/constants';

import type { OrganisationFormValues } from './types';

export interface OrganisationFormFieldsProps {
  /** Whether this is edit mode (shows status field) */
  isEditMode: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Form fields for creating/editing an organisation */
export const OrganisationFormFields: React.FC<OrganisationFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors } = useComposableFormContext<OrganisationFormValues>();

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Organisation Name */}
      <FormTextInput
        name="organisationName"
        label="Organisation Name"
        placeholder="e.g. Acme Physiotherapy Group"
        register={register}
        errors={errors}
        isRequired
      />

      {/* Status (edit mode only) */}
      {isEditMode && (
        <FormSelect
          name="status"
          label="Status"
          options={STATUS_FILTER_OPTIONS}
          control={control}
          errors={errors}
        />
      )}

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditMode ? 'Save Changes' : 'Create Organisation'}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
