import type { AdminTagCategory, TagCategorySlug } from '@ffp/core';

import type { CheckboxGroupOption } from '@web/components/molecules';

/**
 * A category's active tags as options, plus any inactive tag the video was loaded with, so it can
 * be unticked and ticked again before saving.
 */
export const toTagOptions = (
  categories: AdminTagCategory[] | undefined,
  category: TagCategorySlug,
  carried: string[]
): CheckboxGroupOption[] =>
  (categories?.find((candidate) => candidate.slug === category)?.tags ?? [])
    .filter((tag) => tag.isActive || carried.includes(tag.publicId))
    .map((tag) => ({
      value: tag.publicId,
      label: tag.isActive ? tag.label : `${tag.label} (inactive)`,
    }));
