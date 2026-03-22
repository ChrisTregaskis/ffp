import React from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

import type { OrganisationFormValues } from './types';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Inactive', value: 'inactive' },
];

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
          options={STATUS_OPTIONS}
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
