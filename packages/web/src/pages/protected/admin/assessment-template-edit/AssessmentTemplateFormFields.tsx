import React from 'react';

import { StaticAlert, FormActions, FormTextarea, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';

import type { AssessmentTemplateFormValues } from './types';

export interface AssessmentTemplateFormFieldsProps {
  /** Whether this is edit mode (changes the submit label) */
  isEditMode: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Name and description fields for creating or editing an assessment template */
export const AssessmentTemplateFormFields: React.FC<AssessmentTemplateFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, errors } = useComposableFormContext<AssessmentTemplateFormValues>();

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      <FormTextInput
        name="name"
        label="Template Name"
        placeholder="e.g. Everyday activity"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{ required: 'Please give the template a name' }}
      />

      <FormTextarea
        name="description"
        label="Description"
        placeholder="What do these questions find out?"
        register={register}
        errors={errors}
        rows={3}
      />

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Save Changes' : 'Create Template'}
      />
    </>
  );
};
