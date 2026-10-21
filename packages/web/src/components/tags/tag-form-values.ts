import type { AdminTag, CreateTagInput, TagCategorySlug, UpdateTagInput } from '@ffp/core';

import { ApiError } from '@web/lib/api';

export interface TagFormValues {
  label: string;
  slug: string;
}

export const EMPTY_TAG_VALUES: TagFormValues = { label: '', slug: '' };

export const toTagFormValues = (tag: AdminTag): TagFormValues => ({
  label: tag.label,
  slug: tag.slug,
});

export const toCreateTagInput = (
  values: TagFormValues,
  category: TagCategorySlug
): CreateTagInput => ({ category, slug: values.slug.trim(), label: values.label.trim() });

/** Only a changed label is sent: the slug is fixed once the tag exists. */
export const toUpdateTagInput = (values: TagFormValues, tag: AdminTag): UpdateTagInput => {
  const label = values.label.trim();

  return label === tag.label ? {} : { label };
};

/** A 409 on create means the slug is taken in this category */
export const isTakenSlug = (err: Error): boolean => ApiError.isApiError(err) && err.status === 409;
