import React from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { Text } from '@web/components/text';

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
      />

      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="-mt-2 mb-4">
        {STEP_TYPE_DESCRIPTIONS[type]}
      </Text>

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
