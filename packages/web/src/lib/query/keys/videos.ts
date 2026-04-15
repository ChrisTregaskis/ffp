import type { VideoFilterInput } from '@ffp/core';

export const videoKeys = {
  /** Base key for all video queries */
  all: ['videos'] as const,
  /** Video list queries (with optional filters) */
  lists: () => [...videoKeys.all, 'list'] as const,
  /** Video list filtered by specific criteria */
  list: (filters?: VideoFilterInput) => [...videoKeys.lists(), filters ?? {}] as const,
  /** Admin video list queries (paginated, all statuses) */
  adminLists: () => [...videoKeys.all, 'admin-list'] as const,
  /** Admin video list with specific pagination and filter params */
  adminList: (params: Record<string, unknown>) => [...videoKeys.adminLists(), params] as const,
  /** Single video detail queries */
  details: () => [...videoKeys.all, 'detail'] as const,
  /** Single video detail by ID */
  detail: (videoId: string) => [...videoKeys.details(), videoId] as const,
  /** Signed URL queries */
  signedUrls: () => [...videoKeys.all, 'signedUrl'] as const,
  /** Signed URL for a specific video */
  signedUrl: (videoId: string) => [...videoKeys.signedUrls(), videoId] as const,
};
