// Seeded tag categories; the tags within them are admin-authored
export const TAG_CATEGORY_SLUGS = ['goal', 'body-area', 'movement', 'audience'] as const;

export type TagCategorySlug = (typeof TAG_CATEGORY_SLUGS)[number];
