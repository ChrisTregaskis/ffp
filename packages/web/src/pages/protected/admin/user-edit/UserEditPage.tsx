import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { AdminCreateUserInput, AdminUpdateUserInput } from '@ffp/core';

import { PageState } from '@web/components/feedback/PageState';
import { ComposableForm } from '@web/components/form/composableForm';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { useCreateUserMutation, useUpdateUserMutation, useUserDetailQuery } from '@web/hooks/users';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { UserFormFields } from './UserFormFields';

import type { UserFormValues } from './types';

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const isEditMode = !!id;

  const { data: user, isLoading, error } = useUserDetailQuery(id ?? '', { enabled: isEditMode });
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo((): UserFormValues => {
    if (!isEditMode || !user) {
      return {
        email: '',
        firstName: '',
        lastName: '',
        customerId: '',
        phone: '',
        dateOfBirth: '',
      };
    }

    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      customerId: user.customerName ?? '',
      phone: user.phone ?? '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    };
  }, [isEditMode, user]);

  const handleNavigateBack = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_USERS].path);
  }, [navigate]);

  /** Parse and validate date of birth string, returning undefined if empty or invalid */
  const parseDateOfBirth = useCallback((value: string): Date | undefined => {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }, []);

  /** Handle create submission */
  const handleCreate = useCallback(
    (values: UserFormValues) => {
      setSubmitError(null);

      if (values.dateOfBirth && isNaN(new Date(values.dateOfBirth).getTime())) {
        setSubmitError('Date of birth must be a valid date (YYYY-MM-DD)');

        return;
      }

      const input: AdminCreateUserInput = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        customerId: values.customerId,
        phone: values.phone || undefined,
        dateOfBirth: parseDateOfBirth(values.dateOfBirth),
      };

      createMutation.mutate(input, {
        onSuccess: () => {
          addToast('User created successfully', { variant: 'success' });
          handleNavigateBack();
        },
        onError: (err) => {
          setSubmitError(err.message);
        },
      });
    },
    [createMutation, addToast, handleNavigateBack, parseDateOfBirth]
  );

  /** Build update payload with only changed fields */
  const buildUpdatePayload = useCallback(
    (values: UserFormValues): AdminUpdateUserInput => {
      const payload: AdminUpdateUserInput = {};

      if (!user) {
        return payload;
      }

      if (values.firstName !== user.firstName) {
        payload.firstName = values.firstName;
      }

      if (values.lastName !== user.lastName) {
        payload.lastName = values.lastName;
      }

      const newPhone = values.phone || null;

      if (newPhone !== (user.phone ?? null)) {
        payload.phone = newPhone;
      }

      const newDob = values.dateOfBirth || null;
      const currentDob = user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : null;

      if (newDob !== currentDob) {
        payload.dateOfBirth = newDob ? (parseDateOfBirth(newDob) ?? null) : null;
      }

      return payload;
    },
    [user, parseDateOfBirth]
  );

  /** Handle edit submission */
  const handleUpdate = useCallback(
    (values: UserFormValues) => {
      if (!id) {
        return;
      }

      if (values.dateOfBirth && isNaN(new Date(values.dateOfBirth).getTime())) {
        setSubmitError('Date of birth must be a valid date (YYYY-MM-DD)');

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
            addToast('User updated successfully', { variant: 'success' });
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
    (values: UserFormValues) => {
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
      <PageHeader title={isEditMode ? 'Edit User' : 'Create User'} />

      <ContentPanel>
        {isLoadingOrError ? (
          <PageState
            isLoading={isLoading}
            title="Unable to load user"
            message={error?.message}
            actionLabel="Back to Users"
            onAction={handleNavigateBack}
          />
        ) : (
          <ComposableForm<UserFormValues> onSubmit={handleFormSubmit} defaultValues={defaultValues}>
            <UserFormFields
              isEditMode={isEditMode}
              customerDisplayName={user?.customerName ?? undefined}
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
