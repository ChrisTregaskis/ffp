import React from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';

import { AssessmentTemplateField } from '../AssessmentTemplateField';
import { StepEstimatedMinutesField } from '../StepEstimatedMinutesField';

import type { FlowStepFormValues } from '../flow-step-form-values';

/** A movement check pairs a template with the instructions followed on camera. */
export const VideoAssessmentStepFields: React.FC = () => {
  const { register, errors } = useComposableFormContext<FlowStepFormValues>();

  return (
    <>
      <AssessmentTemplateField />

      <FormTextarea<FlowStepFormValues>
        name="instructions"
        label="Instructions (one per line)"
        placeholder={'e.g. Stand with your feet hip-width apart\nKeep the whole body in frame'}
        register={register}
        errors={errors}
        rows={4}
      />

      <StepEstimatedMinutesField />
    </>
  );
};
