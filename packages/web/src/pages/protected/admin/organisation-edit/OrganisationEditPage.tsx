import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateOrganisationInput } from '@ffp/core';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import {
  useCreateOrganisationMutation,
  useOrganisationDetailQuery,
  useUpdateOrganisationMutation,
} from '@web/hooks/organisations';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { OrganisationFormFields } from './OrganisationFormFields';

import type { OrganisationFormValues } from './types';

export const OrganisationEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isEditMode = !!id;

  const {
    data: organisation,
    isLoading,
    error,
  } = useOrganisationDetailQuery(id ?? '', { enabled: isEditMode });
  const createMutation = useCreateOrganisationMutation();
  const updateMutation = useUpdateOrganisationMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo((): OrganisationFormValues => {
    if (!isEditMode || !organisation) {
      return {
        organisationName: '',
        status: 'active',
      };
    }

    return {
      organisationName: organisation.name,
      status: organisation.status,
    };
  }, [isEditMode, organisation]);

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_ORGANISATIONS].path);
  }, [navigate]);

  /** Handle create submission */
  const handleCreate = useCallback(
    (values: OrganisationFormValues) => {
      setSubmitError(null);

      createMutation.mutate(
        { organisationName: values.organisationName },
        {
          onSuccess: () => {
            addToast('Organisation created successfully', { variant: 'success' });
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
    (values: OrganisationFormValues) => {
      if (!id) {
        return;
      }

      const payload = buildUpdatePayload(values);

      if (Object.keys(payload).length === 0) {
        handleNavigateBack();

        return;
      }

      setSubmitError(null);

      updateMutation.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            addToast('Organisation updated successfully', { variant: 'success' });
            handleNavigateBack();
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [id, buildUpdatePayload, updateMutation, addToast, handleNavigateBack]
  );

  const handleFormSubmit = useCallback(
    (values: OrganisationFormValues) => {
      if (isEditMode) {
        handleUpdate(values);
      } else {
        handleCreate(values);
      }
    },
    [isEditMode, handleUpdate, handleCreate]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isLoadingOrError = isEditMode && (isLoading || error);

  return (
    <PageContainer>
      <PageHeader title={isEditMode ? 'Edit Organisation' : 'Create Organisation'} />

      <ContentPanel>
        {isLoadingOrError ? (
          <PageState
            isLoading={isLoading}
            title="Unable to load organisation"
            message={error?.message}
            actionLabel="Back to Organisations"
            onAction={handleNavigateBack}
          />
        ) : (
          <ComposableForm<OrganisationFormValues>
            onSubmit={handleFormSubmit}
            defaultValues={defaultValues}
          >
            <OrganisationFormFields
              isEditMode={isEditMode}
              onCancel={handleNavigateBack}
              isSubmitting={isPending}
              errorMessage={submitError}
            />
          </ComposableForm>
        )}
      </ContentPanel>
    </PageContainer>
  );
};
