import React from 'react';

import { TAG_TEXT_MAX_LENGTH, QUESTION_SLUG_PATTERN } from '@ffp/core';

import { FormActions, FormTextInput } from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { useAutoSlug } from '@web/hooks/useAutoSlug';

import type { TagFormValues } from './tag-form-values';
import type { FieldErrors } from 'react-hook-form';

export interface TagFormFieldsProps {
  /** Creating fills the slug from the label; a saved tag's slug is fixed */
  isEditMode: boolean;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
  /** A slug the server refused as already taken in this category */
  takenSlug?: string;
}

const TAKEN_SLUG_MESSAGE = 'This category already has a tag with this slug. Please choose another.';

const MAX_LENGTH_RULE = {
  value: TAG_TEXT_MAX_LENGTH,
  message: `Keep it to ${String(TAG_TEXT_MAX_LENGTH)} characters`,
};

/** Fields for the inline tag form */
export const TagFormFields: React.FC<TagFormFieldsProps> = ({
  isEditMode,
  onCancel,
  isSubmitting,
  submitLabel,
  takenSlug,
}) => {
  const { register, errors, getValues, watch } = useComposableFormContext<TagFormValues>();

  useAutoSlug<TagFormValues>('label', 'slug', {
    enabled: !isEditMode,
    maxLength: TAG_TEXT_MAX_LENGTH,
  });

  // The refusal shows on the field until the slug changes; the field's own rules take precedence
  const isTaken = takenSlug !== undefined && watch('slug') === takenSlug && !errors.slug;
  const slugErrors: FieldErrors<TagFormValues> = isTaken
    ? { ...errors, slug: { type: 'server', message: TAKEN_SLUG_MESSAGE } }
    : errors;

  return (
    <>
      <FormTextInput<TagFormValues>
        name="label"
        label="Label"
        placeholder="e.g. Better posture"
        register={register}
        errors={errors}
        isRequired
        registerOptions={{
          validate: (value) => value.trim() !== '' || 'Please give the tag a label',
          maxLength: MAX_LENGTH_RULE,
        }}
      />

      {isEditMode ? (
        <FormTextInput<TagFormValues>
          name="slug"
          label="Slug"
          register={register}
          errors={errors}
          readOnly
          hint={`Fixed once the tag is created: ${getValues('slug')}`}
        />
      ) : (
        <FormTextInput<TagFormValues>
          name="slug"
          label="Slug"
          placeholder="e.g. better-posture"
          register={register}
          errors={slugErrors}
          isRequired
          hint="Filled in from the label. It can't be changed once the tag is saved."
          registerOptions={{
            required: 'Please give the tag a slug',
            maxLength: MAX_LENGTH_RULE,
            pattern: {
              value: QUESTION_SLUG_PATTERN,
              message: 'Use lowercase letters, numbers and single hyphens',
            },
          }}
        />
      )}

      <FormActions onCancel={onCancel} submitLabel={submitLabel} isSubmitting={isSubmitting} />
    </>
  );
};
