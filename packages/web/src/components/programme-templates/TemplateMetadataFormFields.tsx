import React from 'react';

import { FormRow } from '@web/components/atoms';
import {
  FormActions,
  StaticAlert,
  FormSelect,
  FormTextarea,
  FormTextInput,
} from '@web/components/molecules';
import { useComposableFormContext, ACTIVE_STATUS_FILTER } from '@web/components/organisms';
import { DIFFICULTY_OPTIONS } from '@web/constants';
import { useAutoSlug } from '@web/hooks/useAutoSlug';

import type { TemplateMetadataFormValues } from './types';

export interface TemplateMetadataFormFieldsProps {
  /** Creating fills the slug from the name and leaves status out; a new template starts active */
  isEditMode: boolean;
  /** Called when cancel is clicked */
  onCancel: () => void;
  /** Whether the submit action is in progress */
  isSubmitting?: boolean;
  /** Error message to display above the form */
  errorMessage?: string | null;
}

/** Form fields for creating or editing programme template metadata */
export const TemplateMetadataFormFields: React.FC<TemplateMetadataFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting = false,
  errorMessage,
}) => {
  const { register, control, errors } = useComposableFormContext<TemplateMetadataFormValues>();

  useAutoSlug<TemplateMetadataFormValues>('name', 'slug', { enabled: !isEditMode });

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

      {/* Row 2: Difficulty + Status (2-col; status in edit mode only) */}
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
        {isEditMode ? (
          <FormSelect
            name="isActive"
            label="Status"
            options={ACTIVE_STATUS_FILTER.options}
            control={control}
            errors={errors}
          />
        ) : (
          <div />
        )}
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

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Save Changes' : 'Create Template'}
      />
    </>
  );
};
