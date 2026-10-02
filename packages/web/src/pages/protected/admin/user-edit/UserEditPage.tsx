import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { AdminCreateUserInput, AdminUpdateUserInput } from '@ffp/core';

import { AdminEditPageShell } from '@web/components/layout';
import { useCreateUserMutation, useUpdateUserMutation, useUserDetailQuery } from '@web/hooks/users';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';

import { EMPTY_USER_VALUES, toUserFormValues } from './user-form-values';
import { UserFormFields } from './UserFormFields';

import type { UserFormValues } from './types';

export const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { submitError, setSubmitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const isEditMode = !!id;

  const { data: user, isLoading, error } = useUserDetailQuery(id ?? '', { enabled: isEditMode });
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();

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
    async (values: UserFormValues): Promise<void> => {
      clearSubmitError();

      if (values.dateOfBirth && isNaN(new Date(values.dateOfBirth).getTime())) {
        setSubmitError('Date of birth must be a valid date (YYYY-MM-DD)');

        return;
      }

      const input: AdminCreateUserInput = {
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        locationId: values.locationId,
        phone: values.phone || undefined,
        dateOfBirth: parseDateOfBirth(values.dateOfBirth),
      };

      await createMutation.mutateAsync(
        input,
        saveCallbacks('User created successfully', handleNavigateBack)
      );
    },
    [
      clearSubmitError,
      setSubmitError,
      createMutation,
      saveCallbacks,
      handleNavigateBack,
      parseDateOfBirth,
    ]
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
    async (values: UserFormValues): Promise<void> => {
      if (!user) {
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

      clearSubmitError();

      await updateMutation.mutateAsync(
        { id: user.id, publicId: user.publicId, data: payload },
        saveCallbacks('User updated successfully', handleNavigateBack)
      );
    },
    [
      user,
      buildUpdatePayload,
      clearSubmitError,
      setSubmitError,
      updateMutation,
      saveCallbacks,
      handleNavigateBack,
    ]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminEditPageShell
      title={isEditMode ? 'Edit User' : 'Create User'}
      resourceLabel="user"
      listLabel="Users"
      isEditMode={isEditMode}
      isLoading={isLoading}
      loadError={error}
      onBack={handleNavigateBack}
      record={user}
      emptyValues={EMPTY_USER_VALUES}
      toFormValues={toUserFormValues}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
    >
      <UserFormFields
        isEditMode={isEditMode}
        onCancel={handleNavigateBack}
        isSubmitting={isPending}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
