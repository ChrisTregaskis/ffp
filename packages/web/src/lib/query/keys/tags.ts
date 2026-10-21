/** Query keys for the tag vocabulary. */
export const tagKeys = {
  all: ['tags'] as const,
  /** Every category with its tags */
  categories: () => [...tagKeys.all, 'categories'] as const,
};
