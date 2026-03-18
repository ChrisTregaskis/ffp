import React, { useCallback } from 'react';

import { ComposableForm } from '@web/components/form/composableForm';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

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

/** Fields for the phase inline form */
const PhaseFormFields: React.FC<{
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}> = ({ onCancel, isSubmitting, submitLabel }) => {
  const { register, errors } = useComposableFormContext<PhaseFormValues>();

  return (
    <>
      <FormTextInput<PhaseFormValues>
        name="name"
        label="Phase Name"
        placeholder="e.g. Foundation Building"
        register={register}
        errors={errors}
        isRequired
      />

      <FormTextarea<PhaseFormValues>
        name="description"
        label="Description"
        placeholder="Optional phase description..."
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
