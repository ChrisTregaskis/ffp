import React from 'react';

import { FormRow } from '@web/components/atoms';
import { FormActions, FormTextarea, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { requiredText } from '@web/utils/form-rules';

import type { SessionFormValues } from './SessionForm';

/** Fields for the session inline form */
export const SessionFormFields: React.FC<{
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
          registerOptions={{ validate: requiredText('Please give the session a name') }}
        />

        <FormTextInput<SessionFormValues>
          name="estimatedDurationMinutes"
          type="number"
          label="Duration (minutes)"
          placeholder="e.g. 30"
          register={register}
          errors={errors}
          inputProps={{ min: 1 }}
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
