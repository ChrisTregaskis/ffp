import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/form/composableForm';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormNumberInput } from '@web/components/form/standardForm/FormNumberInput';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

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

/** Fields for the session inline form */
const SessionFormFields: React.FC<{
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}> = ({ onCancel, isSubmitting, submitLabel }) => {
  const { register, errors } = useComposableFormContext<SessionFormValues>();

  return (
    <>
      <FormRow>
        <FormTextInput<SessionFormValues>
          name="name"
          label="Session Name"
          placeholder="e.g. Lower Body Focus"
          register={register}
          errors={errors}
          isRequired
        />

        <FormNumberInput<SessionFormValues>
          name="estimatedDurationMinutes"
          label="Duration (minutes)"
          placeholder="e.g. 30"
          min={1}
          register={register}
          errors={errors}
        />
      </FormRow>

      <FormTextarea<SessionFormValues>
        name="description"
        label="Description"
        placeholder="Optional session description..."
        register={register}
        errors={errors}
        rows={2}
      />

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        compact
      />
    </>
  );
};

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
