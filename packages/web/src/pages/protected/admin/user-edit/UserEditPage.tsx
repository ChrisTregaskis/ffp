import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { AdminCreateUserInput } from '@ffp/core';

import { AdminEditPageShell } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import { useCreateUserMutation, useUpdateUserMutation, useUserDetailQuery } from '@web/hooks/users';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';

import {
  EMPTY_USER_VALUES,
  parseDateOfBirth,
  toUpdateUserInput,
  toUserFormValues,
} from './user-form-values';
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
    [clearSubmitError, setSubmitError, createMutation, saveCallbacks, handleNavigateBack]
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

      const payload = toUpdateUserInput(values, user);

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
    [user, clearSubmitError, setSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
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
