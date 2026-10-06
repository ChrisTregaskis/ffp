import React from 'react';

import { FormNumberInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

import type { FlowStepFormValues } from './flow-step-form-values';

/** Shown to the member before they start the step. */
export const StepEstimatedMinutesField: React.FC = () => {
  const { register, errors } = useComposableFormContext<FlowStepFormValues>();

  return (
    <FormNumberInput<FlowStepFormValues>
      name="estimatedMinutes"
      label="Estimated minutes"
      placeholder="Optional"
      min={1}
      register={register}
      errors={errors}
    />
  );
};
