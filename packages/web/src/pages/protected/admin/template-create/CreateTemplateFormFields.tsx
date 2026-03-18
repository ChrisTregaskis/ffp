import React, { useEffect, useRef } from 'react';

import { useComposableFormContext } from '@web/components/form/composableForm/FormContext';
import { FormActions } from '@web/components/form/standardForm/FormActions';
import { FormRow } from '@web/components/form/standardForm/FormRow';
import { FormSelect } from '@web/components/form/standardForm/FormSelect';
import { FormTextarea } from '@web/components/form/standardForm/FormTextarea';
import { FormTextInput } from '@web/components/form/standardForm/FormTextInput';
import { toSlug } from '@web/utils/string';

import { DIFFICULTY_OPTIONS } from './constants';

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
  const { register, control, errors, watch, setValue, getValues } =
    useComposableFormContext<CreateTemplateFormValues>();

  /**
   * Track the last slug value we auto-generated. If the current slug differs
   * from this, the user has manually edited it and we stop auto-generating.
   */
  const lastAutoSlug = useRef('');

  const nameValue = watch('name');

  useEffect(() => {
    const currentSlug = getValues('slug');
    const newSlug = toSlug(nameValue);

    // Only auto-generate if the current slug matches our last auto-generated value
    // (or is empty, meaning the user hasn't typed anything yet)
    if (currentSlug === lastAutoSlug.current || currentSlug === '') {
      setValue('slug', newSlug);
      lastAutoSlug.current = newSlug;
    }
  }, [nameValue, setValue, getValues]);

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
