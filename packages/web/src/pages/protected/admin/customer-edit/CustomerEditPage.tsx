import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { UpdateCustomerInput } from '@ffp/core';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import {
  useCreateCustomerMutation,
  useCustomerDetailQuery,
  useUpdateCustomerMutation,
} from '@web/hooks/customers';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { CustomerFormFields } from './CustomerFormFields';

import type { CustomerFormValues } from './types';

export const CustomerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isEditMode = !!id;

  const {
    data: customer,
    isLoading,
    error,
  } = useCustomerDetailQuery(id ?? '', { enabled: isEditMode });
  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo((): CustomerFormValues => {
    if (!isEditMode || !customer) {
      return {
        customerName: '',
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
      customerName: customer.name,
      addressLine1: customer.address?.line1 ?? '',
      addressLine2: customer.address?.line2 ?? '',
      city: customer.address?.city ?? '',
      county: customer.address?.county ?? '',
      postcode: customer.address?.postcode ?? '',
      country: customer.address?.country ?? '',
      status: customer.status,
    };
  }, [isEditMode, customer]);

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_CUSTOMERS].path);
  }, [navigate]);

  /** Build address object from form values, returning undefined if all fields are empty */
  const buildAddress = useCallback((values: CustomerFormValues): UpdateCustomerInput['address'] => {
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
    (values: CustomerFormValues) => {
      setSubmitError(null);

      createMutation.mutate(
        { customerName: values.customerName },
        {
          onSuccess: () => {
            addToast('Customer created successfully', { variant: 'success' });
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
    (values: CustomerFormValues): UpdateCustomerInput => {
      const payload: UpdateCustomerInput = {};

      if (!customer) {
        return payload;
      }

      if (values.customerName !== customer.name) {
        payload.name = values.customerName;
      }

      if (values.status !== customer.status) {
        payload.status = values.status as UpdateCustomerInput['status'];
      }

      // Compare address fields
      const newAddress = buildAddress(values);
      const currentAddress = customer.address;
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
    [customer, buildAddress]
  );

  /** Handle edit submission */
  const handleUpdate = useCallback(
    (values: CustomerFormValues) => {
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
            addToast('Customer updated successfully', { variant: 'success' });
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
    (values: CustomerFormValues) => {
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
      <PageHeader title={isEditMode ? 'Edit Customer' : 'Create Customer'} />

      <ContentPanel>
        {isLoadingOrError ? (
          <PageState
            isLoading={isLoading}
            title="Unable to load customer"
            message={error?.message}
            actionLabel="Back to Customers"
            onAction={handleNavigateBack}
          />
        ) : (
          <ComposableForm<CustomerFormValues>
            onSubmit={handleFormSubmit}
            defaultValues={defaultValues}
          >
            <CustomerFormFields
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
