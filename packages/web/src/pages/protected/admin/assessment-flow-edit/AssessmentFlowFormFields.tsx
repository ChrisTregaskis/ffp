import React from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

import type { AssessmentFlowFormValues } from './types';

export interface AssessmentFlowFormFieldsProps {
  /** Whether this is edit mode (changes the submit label) */
  isEditMode: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Name and description fields for creating or editing an assessment flow */
export const AssessmentFlowFormFields: React.FC<AssessmentFlowFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, errors } = useComposableFormContext<AssessmentFlowFormValues>();

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      <FormTextInput
        name="name"
        label="Flow Name"
        placeholder="e.g. Wellness baseline"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{ required: 'Please give the flow a name' }}
      />

      <FormTextarea
        name="description"
        label="Description"
        placeholder="What is this assessment for?"
        register={register}
        errors={errors}
        rows={3}
      />

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Save Changes' : 'Create Flow'}
      />
    </>
  );
};
