import React from 'react';

import { FormActions, FormTextarea, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { requiredText } from '@web/utils/form-rules';

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
        registerOptions={{ validate: requiredText('Please give the phase a name') }}
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
