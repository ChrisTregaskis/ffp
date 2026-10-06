import React from 'react';

import { FormActions, FormSelect, FormTextarea, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

import { STEP_TYPE_DESCRIPTIONS, STEP_TYPE_OPTIONS } from './flow-step-labels';
import { FlowStepConfigFields } from './FlowStepConfigFields';

import type { FlowStepFormValues } from './flow-step-form-values';

export interface FlowStepFormFieldsProps {
  onCancel: () => void;
  isSubmitting?: boolean;
  submitLabel: string;
}

/** The fields every step shares, then whatever the chosen type adds. */
export const FlowStepFormFields: React.FC<FlowStepFormFieldsProps> = ({
  onCancel,
  isSubmitting = false,
  submitLabel,
}) => {
  const { register, control, errors, watch } = useComposableFormContext<FlowStepFormValues>();
  const type = watch('type');

  return (
    <>
      <FormSelect<FlowStepFormValues>
        name="type"
        label="Step type"
        options={STEP_TYPE_OPTIONS}
        control={control}
        errors={errors}
        isRequired
        hint={STEP_TYPE_DESCRIPTIONS[type]}
      />

      <FormTextInput<FlowStepFormValues>
        name="title"
        label="Title"
        placeholder="e.g. About you"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{ required: 'Please give the step a title' }}
      />

      <FormTextarea<FlowStepFormValues>
        name="description"
        label="Description"
        placeholder="Optional text shown to the member on this step"
        register={register}
        errors={errors}
        rows={2}
      />

      <FlowStepConfigFields type={type} />

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        compact
      />
    </>
  );
};
