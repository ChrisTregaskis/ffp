import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/organisms';

import { SessionFormFields } from './SessionFormFields';

export interface SessionFormValues {
  name: string;
  description: string;
  estimatedDurationMinutes: string;
}

export interface SessionFormProps {
  /** Initial values for editing, empty for creating */
  initialValues?: SessionFormValues;
  /** Called with form values on submit */
  onSubmit: (values: SessionFormValues) => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Submit button label @default "Save" */
  submitLabel?: string;
}

const EMPTY_VALUES: SessionFormValues = { name: '', description: '', estimatedDurationMinutes: '' };

/** Inline form for creating or editing a session */
export const SessionForm: React.FC<SessionFormProps> = ({
  initialValues = EMPTY_VALUES,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}) => {
  const handleFormSubmit = useCallback(
    (values: SessionFormValues) => {
      onSubmit({
        name: values.name.trim(),
        description: values.description.trim(),
        estimatedDurationMinutes: values.estimatedDurationMinutes.trim(),
      });
    },
    [onSubmit]
  );

  return (
    <ComposableForm<SessionFormValues> onSubmit={handleFormSubmit} defaultValues={initialValues}>
      <SessionFormFields
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
      />
    </ComposableForm>
  );
};
