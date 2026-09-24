import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateLocationInput } from '@ffp/core';

import { AdminEditPageShell } from '@web/components/layout';
import {
  useCreateLocationMutation,
  useLocationDetailQuery,
  useUpdateLocationMutation,
} from '@web/hooks/locations';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { EMPTY_LOCATION_VALUES, toLocationFormValues } from './location-form-values';
import { LocationFormFields } from './LocationFormFields';

import type { LocationFormValues } from './types';

export const LocationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isEditMode = !!id;

  const {
    data: location,
    isLoading,
    error,
  } = useLocationDetailQuery(id ?? '', { enabled: isEditMode });

  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_LOCATIONS].path);
  }, [navigate]);

  /** Build address object from form values, returning undefined if all fields are empty */
  const buildAddress = useCallback((values: LocationFormValues): UpdateLocationInput['address'] => {
    const address = {
      line1: values.addressLine1 || undefined,
      line2: values.addressLine2 || undefined,
      city: values.city || undefined,
      county: values.county || undefined,
      postcode: values.postcode || undefined,
      country: values.country || undefined,
    };

    // Return undefined if all fields are empty
    const hasValues = Object.values(address).some((v) => v !== undefined);

    return hasValues ? address : undefined;
  }, []);

  /** Handle create submission */
  const handleCreate = useCallback(
    async (values: LocationFormValues): Promise<void> => {
      setSubmitError(null);

      await createMutation.mutateAsync(
        { organisationId: values.organisationId, data: { locationName: values.locationName } },
        {
          onSuccess: () => {
            addToast('Location created successfully', { variant: 'success' });
            handleNavigateBack();
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [createMutation, addToast, handleNavigateBack]
  );

  /** Build update payload with only changed fields */
  const buildUpdatePayload = useCallback(
    (values: LocationFormValues): UpdateLocationInput => {
      const payload: UpdateLocationInput = {};

      if (!location) {
        return payload;
      }

      if (values.locationName !== location.name) {
        payload.name = values.locationName;
      }

      if (values.status !== location.status) {
        payload.status = values.status as UpdateLocationInput['status'];
      }

      // Compare address fields
      const newAddress = buildAddress(values);
      const currentAddress = location.address;
      const addressChanged =
        (values.addressLine1 || '') !== (currentAddress?.line1 ?? '') ||
        (values.addressLine2 || '') !== (currentAddress?.line2 ?? '') ||
        (values.city || '') !== (currentAddress?.city ?? '') ||
        (values.county || '') !== (currentAddress?.county ?? '') ||
        (values.postcode || '') !== (currentAddress?.postcode ?? '') ||
        (values.country || '') !== (currentAddress?.country ?? '');

      if (addressChanged) {
        payload.address = newAddress;
      }

      return payload;
    },
    [location, buildAddress]
  );

  /** Handle edit submission */
  const handleUpdate = useCallback(
    async (values: LocationFormValues): Promise<void> => {
      if (!location) {
        return;
      }

      const payload = buildUpdatePayload(values);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      setSubmitError(null);

      await updateMutation.mutateAsync(
        { id: location.id, publicId: location.publicId, data: payload },
        {
          onSuccess: () => {
            addToast('Location updated successfully', { variant: 'success' });
            handleNavigateBack();
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [location, buildUpdatePayload, updateMutation, addToast, handleNavigateBack]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminEditPageShell
      title={isEditMode ? 'Edit Location' : 'Create Location'}
      resourceLabel="location"
      listLabel="Locations"
      isEditMode={isEditMode}
      isLoading={isLoading}
      loadError={error}
      onBack={handleNavigateBack}
      record={location}
      emptyValues={EMPTY_LOCATION_VALUES}
      toFormValues={toLocationFormValues}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
    >
      <LocationFormFields
        isEditMode={isEditMode}
        onCancel={handleNavigateBack}
        isSubmitting={isPending}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
