import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/form/composableForm';

import { PhaseFormFields } from './PhaseFormFields';

export interface PhaseFormValues {
  name: string;
  description: string;
}

export interface PhaseFormProps {
  /** Initial values for editing, empty for creating */
  initialValues?: PhaseFormValues;
  /** Called with form values on submit */
  onSubmit: (values: PhaseFormValues) => void;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Submit button label @default "Save" */
  submitLabel?: string;
}

const EMPTY_VALUES: PhaseFormValues = { name: '', description: '' };

/** Inline form for creating or editing a phase */
export const PhaseForm: React.FC<PhaseFormProps> = ({
  initialValues = EMPTY_VALUES,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}) => {
  const handleFormSubmit = useCallback(
    (values: PhaseFormValues) => {
      onSubmit({
        name: values.name.trim(),
        description: values.description.trim(),
      });
    },
    [onSubmit]
  );

  return (
    <ComposableForm<PhaseFormValues> onSubmit={handleFormSubmit} defaultValues={initialValues}>
      <PhaseFormFields onCancel={onCancel} isSubmitting={isSubmitting} submitLabel={submitLabel} />
    </ComposableForm>
  );
};
