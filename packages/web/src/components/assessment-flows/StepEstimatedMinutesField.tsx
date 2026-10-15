import React from 'react';

import { FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

import type { FlowStepFormValues } from './flow-step-form-values';

/** Shown to the member before they start the step. */
export const StepEstimatedMinutesField: React.FC = () => {
  const { register, errors } = useComposableFormContext<FlowStepFormValues>();

  return (
    <FormTextInput<FlowStepFormValues>
      name="estimatedMinutes"
      type="number"
      label="Estimated minutes"
      placeholder="Optional"
      register={register}
      errors={errors}
      inputProps={{ min: 1 }}
    />
  );
};
