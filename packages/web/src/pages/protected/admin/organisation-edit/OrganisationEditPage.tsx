import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateOrganisationInput } from '@ffp/core';

import { DeactivateOrganisationModal } from '@web/components/organisations';
import { AdminEditPageShell } from '@web/components/templates';
import {
  useCreateOrganisationMutation,
  useOrganisationDetailQuery,
  useUpdateOrganisationMutation,
} from '@web/hooks/organisations';
import { useConfirmBeforeSave } from '@web/hooks/useConfirmBeforeSave';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';

import {
  EMPTY_ORGANISATION_VALUES,
  toOrganisationFormValues,
  toUpdateOrganisationInput,
} from './organisation-form-values';
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

  /** Execute the update mutation */
  const executeUpdate = useCallback(
    async (data: UpdateOrganisationInput): Promise<void> => {
      if (!organisation) {
        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: organisation.id, publicId: organisation.publicId, data },
        saveCallbacks('Organisation updated successfully', handleNavigateBack)
      );
    },
    [organisation, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
  );

  const deactivateConfirm = useConfirmBeforeSave(executeUpdate);
  const { requestConfirm: requestDeactivateConfirm } = deactivateConfirm;

  /** Handle edit submission — taking the organisation out of use waits for confirmation */
  const handleUpdate = useCallback(
    async (values: OrganisationFormValues): Promise<void> => {
      if (!organisation) {
        return;
      }

      const payload = toUpdateOrganisationInput(values, organisation);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      if (payload.status === 'inactive') {
        await requestDeactivateConfirm(payload);

        return;
      }

      await executeUpdate(payload);
    },
    [organisation, executeUpdate, requestDeactivateConfirm, handleNavigateBack]
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
      footer={
        <DeactivateOrganisationModal
          isOpen={deactivateConfirm.isConfirmOpen}
          onClose={deactivateConfirm.cancel}
          onConfirm={deactivateConfirm.confirm}
          organisationName={organisation?.name ?? ''}
        />
      }
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
