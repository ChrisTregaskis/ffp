import { adminVideoFilterSchema } from '@ffp/core';
import type { AdminTagCategory, AdminVideoFilterInput } from '@ffp/core';

import type { TableFilterConfig } from '@web/components/organisms';
import type { ListFilterValues } from '@web/components/templates';
import { toTagOption } from '@web/components/video';

const TAG_FILTER_PREFIX = 'tag-';

/** One toolbar filter per tag category, every tag offered so retired ones can still be found */
export const toTagFilters = (categories: AdminTagCategory[] | undefined): TableFilterConfig[] =>
  (categories ?? []).map((category) => ({
    key: `${TAG_FILTER_PREFIX}${category.slug}`,
    label: category.label,
    options: category.tags.map(toTagOption),
  }));

/**
 * The toolbar's values as the list's filter: each category's selection joins the one `tags`
 * filter, which the API matches across categories. The rest pass through the list's schema.
 */
export const toVideoListFilters = (filters: ListFilterValues): AdminVideoFilterInput => {
  const tags: string[] = [];
  const rest: ListFilterValues = {};

  for (const [key, value] of Object.entries(filters)) {
    if (key.startsWith(TAG_FILTER_PREFIX)) {
      if (value) {
        tags.push(value);
      }
    } else {
      rest[key] = value;
    }
  }

  const parsed = adminVideoFilterSchema.safeParse({
    ...rest,
    tags: tags.length > 0 ? tags : undefined,
  });

  return parsed.success ? parsed.data : {};
};
