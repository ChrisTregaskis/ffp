import React, { useEffect, useMemo, useRef } from 'react';

import { SLOT_LABEL_MAX_LENGTH } from '@ffp/core';

import { FormRow, Text } from '@web/components/atoms';
import {
  FormActions,
  FormCheckboxGroup,
  FormSelect,
  FormTextInput,
  FormToggle,
} from '@web/components/molecules';
import { useComposableFormContext } from '@web/components/organisms';
import { toTagOptions } from '@web/components/tags';
import { useTagCategoriesQuery } from '@web/hooks/tags';

import type { SlotFormValues } from './slot-form-values';

export interface SlotFormFieldsProps {
  /** Tag publicIds the slot was loaded with, so an inactive one stays listed */
  carriedTagIds: string[];
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

/** Fields for the slot inline form: what the slot draws from and how it is filled */
export const SlotFormFields: React.FC<SlotFormFieldsProps> = ({
  carriedTagIds,
  onCancel,
  isSubmitting,
  submitLabel,
}) => {
  const { register, control, errors, watch, setValue } = useComposableFormContext<SlotFormValues>();
  const { data: tagCategories, isError } = useTagCategoriesQuery();
  const category = watch('category');
  const previousCategory = useRef(category);

  // Every tag must sit in the slot's category, so a new category starts with none ticked
  useEffect(() => {
    if (previousCategory.current !== category) {
      previousCategory.current = category;
      setValue('tags', []);
    }
  }, [category, setValue]);

  const categoryOptions = useMemo(
    () => (tagCategories ?? []).map(({ slug, label }) => ({ value: slug, label })),
    [tagCategories]
  );
  const categoryLabel = tagCategories?.find((candidate) => candidate.slug === category)?.label;

  return (
    <>
      {isError && (
        <Text as="p" styleProps={{ size: 'sm', colour: 'destructive' }}>
          Tags could not be loaded. Reload to try again.
        </Text>
      )}

      <FormRow>
        <FormSelect<SlotFormValues>
          name="category"
          label="Category"
          options={categoryOptions}
          placeholder="Select a category..."
          control={control}
          errors={errors}
          isRequired
          rules={{ required: 'Please choose a category' }}
        />

        <FormTextInput<SlotFormValues>
          name="label"
          label="Label"
          placeholder="e.g. Warm-up"
          hint="For authors only; it doesn't change what the slot draws from."
          register={register}
          errors={errors}
          registerOptions={{
            maxLength: {
              value: SLOT_LABEL_MAX_LENGTH,
              message: `Label must be ${String(SLOT_LABEL_MAX_LENGTH)} characters or fewer`,
            },
          }}
        />
      </FormRow>

      {category && categoryLabel && (
        <FormCheckboxGroup<SlotFormValues>
          name="tags"
          label={`${categoryLabel} tags`}
          options={toTagOptions(tagCategories, category, carriedTagIds)}
          hint={`Leave all unticked to draw from any ${categoryLabel.toLowerCase()}.`}
          control={control}
          errors={errors}
        />
      )}

      <FormToggle<SlotFormValues>
        name="isRequired"
        label="Required"
        hint="A required slot must be filled when a programme is built; an optional one may stay empty."
        control={control}
      />

      <FormActions
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        compact
      />
    </>
  );
};
