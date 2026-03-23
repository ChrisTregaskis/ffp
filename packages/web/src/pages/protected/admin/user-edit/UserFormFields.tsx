import React, { useMemo } from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { useAdminLocationsQuery } from '@web/hooks/locations';

import type { UserFormValues } from './types';

export interface UserFormFieldsProps {
  /** Whether this is edit mode (email and location are read-only) */
  isEditMode: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Form fields for creating/editing a programme user */
export const UserFormFields: React.FC<UserFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors } = useComposableFormContext<UserFormValues>();

  // Load locations for the selector (fetch all active locations, no pagination needed for selector)
  const { data: locationsData } = useAdminLocationsQuery(
    { page: 1, pageSize: 100, sortDirection: 'asc', sortBy: 'name' },
    {},
    { enabled: !isEditMode }
  );

  const locationOptions = useMemo(
    () =>
      locationsData?.data.map((location) => ({
        label: `${location.name} (${location.accountCode})`,
        value: location.id,
      })) ?? [],
    [locationsData]
  );

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Email — disabled in edit mode */}
      <FormTextInput
        name="email"
        label="Email"
        type="email"
        placeholder="user@example.com"
        register={register}
        errors={errors}
        isRequired={!isEditMode}
        disabled={isEditMode}
      />

      {/* First Name + Last Name */}
      <FormRow>
        <FormTextInput
          name="firstName"
          label="First Name"
          placeholder="First name"
          register={register}
          errors={errors}
          isRequired
        />
        <FormTextInput
          name="lastName"
          label="Last Name"
          placeholder="Last name"
          register={register}
          errors={errors}
          isRequired
        />
      </FormRow>

      {/* Location — disabled input in edit mode, selector in create mode */}
      {isEditMode ? (
        <FormTextInput
          name="locationDisplay"
          label="Location"
          register={register}
          errors={errors}
          disabled
        />
      ) : (
        <FormSelect
          name="locationId"
          label="Location"
          options={locationOptions}
          placeholder="Select a location..."
          control={control}
          errors={errors}
          isRequired
        />
      )}

      {/* Phone + Date of Birth */}
      <FormRow>
        <FormTextInput
          name="phone"
          label="Phone"
          placeholder="Phone number"
          register={register}
          errors={errors}
        />
        <FormTextInput
          name="dateOfBirth"
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
          register={register}
          errors={errors}
        />
      </FormRow>

      <FormActions
        onCancel={onCancel}
        submitLabel={isEditMode ? 'Save Changes' : 'Create User'}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
