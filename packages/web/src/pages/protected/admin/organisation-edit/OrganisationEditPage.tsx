import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateOrganisationInput } from '@ffp/core';

import { AdminEditPageShell } from '@web/components/templates';
import {
  useCreateOrganisationMutation,
  useOrganisationDetailQuery,
  useUpdateOrganisationMutation,
} from '@web/hooks/organisations';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';

import { EMPTY_ORGANISATION_VALUES, toOrganisationFormValues } from './organisation-form-values';
import { OrganisationFormFields } from './OrganisationFormFields';

import type { OrganisationFormValues } from './types';

export const OrganisationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const isEditMode = !!id;

  const {
    data: organisation,
    isLoading,
    error,
  } = useOrganisationDetailQuery(id ?? '', { enabled: isEditMode });
  const createMutation = useCreateOrganisationMutation();
  const updateMutation = useUpdateOrganisationMutation();

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_ORGANISATIONS].path);
  }, [navigate]);

  /** Handle create submission */
  const handleCreate = useCallback(
    async (values: OrganisationFormValues): Promise<void> => {
      clearSubmitError();

      await createMutation.mutateAsync(
        { organisationName: values.organisationName },
        saveCallbacks('Organisation created successfully', handleNavigateBack)
      );
    },
    [clearSubmitError, createMutation, saveCallbacks, handleNavigateBack]
  );

  /** Build update payload with only changed fields */
  const buildUpdatePayload = useCallback(
    (values: OrganisationFormValues): UpdateOrganisationInput => {
      const payload: UpdateOrganisationInput = {};

      if (!organisation) {
        return payload;
      }

      if (values.organisationName !== organisation.name) {
        payload.name = values.organisationName;
      }

      if (values.status !== organisation.status) {
        payload.status = values.status as UpdateOrganisationInput['status'];
      }

      return payload;
    },
    [organisation]
  );

  /** Handle edit submission */
  const handleUpdate = useCallback(
    async (values: OrganisationFormValues): Promise<void> => {
      if (!organisation) {
        return;
      }

      const payload = buildUpdatePayload(values);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: organisation.id, publicId: organisation.publicId, data: payload },
        saveCallbacks('Organisation updated successfully', handleNavigateBack)
      );
    },
    [
      organisation,
      buildUpdatePayload,
      clearSubmitError,
      updateMutation,
      saveCallbacks,
      handleNavigateBack,
    ]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminEditPageShell
      title={isEditMode ? 'Edit Organisation' : 'Create Organisation'}
      resourceLabel="organisation"
      listLabel="Organisations"
      isEditMode={isEditMode}
      isLoading={isLoading}
      loadError={error}
      onBack={handleNavigateBack}
      record={organisation}
      emptyValues={EMPTY_ORGANISATION_VALUES}
      toFormValues={toOrganisationFormValues}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
    >
      <OrganisationFormFields
        isEditMode={isEditMode}
        onCancel={handleNavigateBack}
        isSubmitting={isPending}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
