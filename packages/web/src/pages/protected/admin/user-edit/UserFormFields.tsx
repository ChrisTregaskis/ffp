import React, { useMemo } from 'react';

import { FormRow } from '@web/components/atoms';
import {
  FormActions,
  FormEmailInput,
  FormSelect,
  FormTextInput,
  StaticAlert,
} from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
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
      <FormEmailInput
        name="email"
        label="Email"
        placeholder="user@example.com"
        register={register}
        errors={errors}
        requiredMessage={isEditMode ? undefined : 'Please give the user an email address'}
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
          registerOptions={{ required: 'Please give the user a first name' }}
        />
        <FormTextInput
          name="lastName"
          label="Last Name"
          placeholder="Last name"
          register={register}
          errors={errors}
          isRequired
          registerOptions={{ required: 'Please give the user a last name' }}
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
          rules={{ required: 'Please choose a location' }}
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
