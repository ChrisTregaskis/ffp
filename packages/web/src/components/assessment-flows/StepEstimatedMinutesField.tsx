import React from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormNumberInput } from '@web/components/form/standardForm/FormNumberInput';

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
