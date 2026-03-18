import React from 'react';

import { StaticAlert } from '@web/components/feedback/StaticAlert';
import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';

import { DIFFICULTY_OPTIONS, STATUS_OPTIONS } from './constants';

import type { TemplateMetadataFormValues } from './types';

export interface TemplateMetadataFormFieldsProps {
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Form fields for editing programme template metadata */
export const TemplateMetadataFormFields: React.FC<TemplateMetadataFormFieldsProps> = ({
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors } = useComposableFormContext<TemplateMetadataFormValues>();

  return (
    <>
      {errorMessage && <StaticAlert variant="error" message={errorMessage} className="mb-4" />}

      {/* Row 1: Name + Slug (2-col) */}
      <FormRow>
        <FormTextInput
          name="name"
          label="Template Name"
          placeholder="e.g. Gentle Mobility Programme"
          register={register}
          errors={errors}
          isRequired
        />
        <FormTextInput
          name="slug"
          label="Slug"
          placeholder="e.g. gentle-mobility-programme"
          register={register}
          errors={errors}
          isRequired
        />
      </FormRow>

      {/* Row 2: Difficulty + Status (2-col) */}
      <FormRow>
        <FormSelect
          name="difficulty"
          label="Difficulty"
          options={DIFFICULTY_OPTIONS}
          placeholder="Select level..."
          control={control}
          errors={errors}
          isRequired
        />
        <FormSelect
          name="isActive"
          label="Status"
          options={STATUS_OPTIONS}
          control={control}
          errors={errors}
        />
      </FormRow>

      {/* Row 3: Description (full-width) */}
      <FormTextarea
        name="description"
        label="Description"
        placeholder="Describe the programme template..."
        register={register}
        errors={errors}
        rows={3}
      />

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} />
    </>
  );
};
