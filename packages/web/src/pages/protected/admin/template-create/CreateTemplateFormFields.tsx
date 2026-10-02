import React from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { useAutoSlug } from '@web/components/form/hooks/useAutoSlug';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { DIFFICULTY_OPTIONS } from '@web/components/form/templates/constants';

import type { CreateTemplateFormValues } from './types';

export interface CreateTemplateFormFieldsProps {
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
}

/** Form fields for creating a new programme template with slug auto-generation */
export const CreateTemplateFormFields: React.FC<CreateTemplateFormFieldsProps> = ({
  onCancel,
  isSubmitting = false,
}) => {
  const { register, control, errors } = useComposableFormContext<CreateTemplateFormValues>();

  useAutoSlug<CreateTemplateFormValues>('name', 'slug');

  return (
    <>
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

      {/* Row 2: Difficulty (single col) */}
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
        <div />
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

      <FormActions onCancel={onCancel} isSubmitting={isSubmitting} submitLabel="Create Template" />
    </>
  );
};
