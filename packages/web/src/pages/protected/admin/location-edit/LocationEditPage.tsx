import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { DeactivateLocationModal } from '@web/components/locations';
import { AdminEditPageShell } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import {
  useCreateLocationMutation,
  useLocationDetailQuery,
  useUpdateLocationMutation,
} from '@web/hooks/locations';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';

import {
  deactivatesLocation,
  EMPTY_LOCATION_VALUES,
  toLocationFormValues,
  toUpdateLocationInput,
} from './location-form-values';
import { LocationFormFields } from './LocationFormFields';

import type { LocationFormValues } from './types';

export const LocationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const isEditMode = !!id;

  const {
    data: location,
    isLoading,
    error,
  } = useLocationDetailQuery(id ?? '', { enabled: isEditMode });

  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_LOCATIONS].path);
  }, [navigate]);

  /** Handle create submission */
  const handleCreate = useCallback(
    async (values: LocationFormValues): Promise<void> => {
      clearSubmitError();

      await createMutation.mutateAsync(
        { organisationId: values.organisationId, data: { locationName: values.locationName } },
        saveCallbacks('Location created successfully', handleNavigateBack)
      );
    },
    [clearSubmitError, createMutation, saveCallbacks, handleNavigateBack]
  );

  /** Handle edit submission; taking the location out of use waits for the shell's confirm */
  const handleUpdate = useCallback(
    async (values: LocationFormValues): Promise<void> => {
      if (!location) {
        return;
      }

      const payload = toUpdateLocationInput(values, location);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: location.id, publicId: location.publicId, data: payload },
        saveCallbacks('Location updated successfully', handleNavigateBack)
      );
    },
    [location, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
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
      confirmBeforeSave={{
        when: deactivatesLocation,
        renderModal: (modalProps) => (
          <DeactivateLocationModal {...modalProps} locationName={location?.name ?? ''} />
        ),
      }}
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
