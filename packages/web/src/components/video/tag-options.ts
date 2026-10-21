import { tagCategorySlugSchema } from '@ffp/core';
import type { AdminTag, AdminTagCategory, TagCategorySlug, VideoTags } from '@ffp/core';

import type { CheckboxGroupOption } from '@web/components/molecules';

/** A tag as a choice, marked when it is no longer in use */
export const toTagOption = (tag: AdminTag): CheckboxGroupOption => ({
  value: tag.publicId,
  label: tag.isActive ? tag.label : `${tag.label} (inactive)`,
});

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
    .map(toTagOption);

/** Each category's tag publicIds as form values; every category is present, empty when untagged */
export const toTagSelection = (tags?: VideoTags): Record<TagCategorySlug, string[]> =>
  Object.fromEntries(
    tagCategorySlugSchema.options.map((slug) => [
      slug,
      (tags?.[slug] ?? []).map((tag) => tag.publicId),
    ])
  ) as Record<TagCategorySlug, string[]>;
