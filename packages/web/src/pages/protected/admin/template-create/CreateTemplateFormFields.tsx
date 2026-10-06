import React from 'react';

import { FormRow } from '@web/components/atoms';
import { FormActions, FormSelect, FormTextarea, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { DIFFICULTY_OPTIONS } from '@web/constants';
import { useAutoSlug } from '@web/hooks/useAutoSlug';

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
          registerOptions={{ required: 'Please give the template a name' }}
        />
        <FormTextInput
          name="slug"
          label="Slug"
          placeholder="e.g. gentle-mobility-programme"
          register={register}
          errors={errors}
          isRequired
          registerOptions={{ required: 'Please give the template a slug' }}
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
          rules={{ required: 'Please choose a difficulty' }}
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
