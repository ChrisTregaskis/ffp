import React from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';

import { StepEstimatedMinutesField } from '../StepEstimatedMinutesField';

import type { FlowStepFormValues } from '../flow-step-form-values';

/** A transition raises things to be aware of before moving on. */
export const TransitionStepFields: React.FC = () => {
  const { register, errors } = useComposableFormContext<FlowStepFormValues>();

  return (
    <>
      <FormTextarea<FlowStepFormValues>
        name="safetyNotes"
        label="Things to be aware of (one per line)"
        placeholder={'e.g. Work within a comfortable range\nStop if anything feels wrong'}
        register={register}
        errors={errors}
        rows={4}
      />

      <StepEstimatedMinutesField />
    </>
  );
};
