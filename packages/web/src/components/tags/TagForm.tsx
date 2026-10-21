import React from 'react';

import { ComposableForm } from '@web/components/organisms';

import { EMPTY_TAG_VALUES } from './tag-form-values';
import { TagFormFields } from './TagFormFields';

import type { TagFormValues } from './tag-form-values';

export interface TagFormProps {
  /** A saved tag's values; absent when adding one */
  initialValues?: TagFormValues;
  onSubmit: (values: TagFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  /** A slug the server refused as already taken in this category */
  takenSlug?: string;
}

/** Inline form for adding a tag, or renaming one */
export const TagForm: React.FC<TagFormProps> = ({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  takenSlug,
}) => {
  const isEditMode = initialValues !== undefined;

  return (
    <ComposableForm<TagFormValues>
      onSubmit={onSubmit}
      defaultValues={initialValues ?? EMPTY_TAG_VALUES}
    >
      <TagFormFields
        isEditMode={isEditMode}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        submitLabel={isEditMode ? 'Save' : 'Add Tag'}
        takenSlug={takenSlug}
      />
    </ComposableForm>
  );
};
