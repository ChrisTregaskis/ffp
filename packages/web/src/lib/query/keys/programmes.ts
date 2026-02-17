/**
 * Programme Query Key Factory
 *
 * @description Hierarchical query keys for efficient cache invalidation.
 * Uses the factory pattern recommended by TanStack Query.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */
export const programmeKeys = {
  /** Base key for all programme queries */
  all: ['programmes'] as const,

  /** Active programme for the current user */
  active: () => [...programmeKeys.all, 'active'] as const,
};
