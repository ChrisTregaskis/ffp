import React from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

import type { CustomerFormValues } from './types';

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Inactive', value: 'inactive' },
];

export interface CustomerFormFieldsProps {
  /** Whether this is edit mode (shows status field) */
  isEditMode: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Form fields for creating/editing a customer */
export const CustomerFormFields: React.FC<CustomerFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors } = useComposableFormContext<CustomerFormValues>();

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Customer Name */}
      <FormTextInput
        name="customerName"
        label="Customer Name"
        placeholder="e.g. Sunshine Care Home"
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

      {/* Address fields */}
      <FormTextInput
        name="addressLine1"
        label="Address Line 1"
        placeholder="Street address"
        register={register}
        errors={errors}
      />

      <FormTextInput
        name="addressLine2"
        label="Address Line 2"
        placeholder="Apartment, suite, etc."
        register={register}
        errors={errors}
      />

      {/* City + County */}
      <FormRow>
        <FormTextInput
          name="city"
          label="City"
          placeholder="City"
          register={register}
          errors={errors}
        />
        <FormTextInput
          name="county"
          label="County"
          placeholder="County"
          register={register}
          errors={errors}
        />
      </FormRow>

      {/* Postcode + Country */}
      <FormRow>
        <FormTextInput
          name="postcode"
          label="Postcode"
          placeholder="Postcode"
          register={register}
          errors={errors}
        />
        <FormTextInput
          name="country"
          label="Country"
          placeholder="Country"
          register={register}
          errors={errors}
        />
      </FormRow>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditMode ? 'Save Changes' : 'Create Customer'}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
