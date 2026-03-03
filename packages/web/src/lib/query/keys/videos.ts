import type { VideoFilterInput } from '@ffp/core';

/**
 * Video Query Key Factory
 *
 * @description Hierarchical query keys for efficient cache invalidation.
 * Uses the factory pattern recommended by TanStack Query.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
 */
export const videoKeys = {
  /** Base key for all video queries */
  all: ['videos'] as const,

  /** Video list queries (with optional filters) */
  lists: () => [...videoKeys.all, 'list'] as const,

  /** Video list filtered by specific criteria */
  list: (filters?: VideoFilterInput) => [...videoKeys.lists(), filters ?? {}] as const,

  /** Single video detail queries */
  details: () => [...videoKeys.all, 'detail'] as const,

  /** Single video detail by ID */
  detail: (videoId: string) => [...videoKeys.details(), videoId] as const,
};
