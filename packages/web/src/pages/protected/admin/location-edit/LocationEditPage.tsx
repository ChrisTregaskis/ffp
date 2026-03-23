import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateLocationInput } from '@ffp/core';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import {
  useCreateLocationMutation,
  useLocationDetailQuery,
  useUpdateLocationMutation,
} from '@web/hooks/locations';
import { useOrganisationDetailQuery } from '@web/hooks/organisations';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

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

  // Resolve organisation name for edit mode display
  const { data: organisation } = useOrganisationDetailQuery(location?.organisationId ?? '', {
    enabled: isEditMode && !!location?.organisationId,
  });

  const createMutation = useCreateLocationMutation();
  const updateMutation = useUpdateLocationMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo((): LocationFormValues => {
    if (!isEditMode || !location) {
      return {
        locationName: '',
        organisationId: '',
        organisationDisplay: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        county: '',
        postcode: '',
        country: '',
        status: 'active',
      };
    }

    return {
      locationName: location.name,
      organisationId: location.organisationId,
      organisationDisplay: organisation?.name ?? location.organisationId,
      addressLine1: location.address?.line1 ?? '',
      addressLine2: location.address?.line2 ?? '',
      city: location.address?.city ?? '',
      county: location.address?.county ?? '',
      postcode: location.address?.postcode ?? '',
      country: location.address?.country ?? '',
      status: location.status,
    };
  }, [isEditMode, location, organisation]);

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
    (values: LocationFormValues) => {
      setSubmitError(null);

      createMutation.mutate(
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
    (values: LocationFormValues) => {
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
            addToast('Location updated successfully', { variant: 'success' });
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
    (values: LocationFormValues) => {
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
      <PageHeader title={isEditMode ? 'Edit Location' : 'Create Location'} />

      <ContentPanel>
        {isLoadingOrError ? (
          <PageState
            isLoading={isLoading}
            title="Unable to load location"
            message={error?.message}
            actionLabel="Back to Locations"
            onAction={handleNavigateBack}
          />
        ) : (
          <ComposableForm<LocationFormValues>
            onSubmit={handleFormSubmit}
            defaultValues={defaultValues}
          >
            <LocationFormFields
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
