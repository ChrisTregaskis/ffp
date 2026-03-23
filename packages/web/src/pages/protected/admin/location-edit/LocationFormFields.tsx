import React, { useMemo } from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { useAdminOrganisationsQuery } from '@web/hooks/organisations';
import { STATUS_FILTER_OPTIONS } from '@web/pages/protected/admin/location-list/constants';

import type { LocationFormValues } from './types';

export interface LocationFormFieldsProps {
  /** Whether this is edit mode (shows status field, organisation read-only) */
  isEditMode: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Form fields for creating/editing a location */
export const LocationFormFields: React.FC<LocationFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors } = useComposableFormContext<LocationFormValues>();

  // Load organisations for the selector (fetch all active, no pagination needed for selector)
  const { data: organisationsData } = useAdminOrganisationsQuery(
    { page: 1, pageSize: 100, sortDirection: 'asc', sortBy: 'name' },
    {},
    { enabled: !isEditMode }
  );

  const organisationOptions = useMemo(
    () =>
      organisationsData?.data.map((org) => ({
        label: org.name,
        value: org.id,
      })) ?? [],
    [organisationsData]
  );

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Organisation — selector in create mode, read-only in edit mode */}
      {isEditMode ? (
        <FormTextInput
          name="organisationDisplay"
          label="Organisation"
          register={register}
          errors={errors}
          disabled
        />
      ) : (
        <FormSelect
          name="organisationId"
          label="Organisation"
          options={organisationOptions}
          placeholder="Select an organisation..."
          control={control}
          errors={errors}
          isRequired
        />
      )}

      {/* Location Name */}
      <FormTextInput
        name="locationName"
        label="Location Name"
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
          options={STATUS_FILTER_OPTIONS}
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
        submitLabel={isEditMode ? 'Save Changes' : 'Create Location'}
        isSubmitting={isSubmitting}
      />
    </>
  );
};
