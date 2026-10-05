import React from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

import type { PhaseFormValues } from './PhaseForm';

/** Fields for the phase inline form */
export const PhaseFormFields: React.FC<{
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
