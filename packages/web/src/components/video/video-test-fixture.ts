import { paginatedAdminVideoResponseSchema, videoDetailResponseSchema } from '@ffp/core';
import type { VideoDetailResponse } from '@ffp/core';

import type { PaginatedAdminVideoResponse } from '@web/lib/api/endpoints';

const TAGS = { goal: [], 'body-area': [], movement: [], audience: [] };

const STAMPS = { createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

/** A video as the picker's detail fetch returns it, with the defaults a test sets */
export const videoDetail = (
  id: string,
  title: string,
  defaults: Partial<
    Pick<
      VideoDetailResponse,
      | 'defaultSets'
      | 'defaultReps'
      | 'defaultDurationSeconds'
      | 'defaultRestSeconds'
      | 'defaultNotes'
    >
  > = {}
): VideoDetailResponse =>
  videoDetailResponseSchema.parse({
    id,
    publicId: `v${id.replace(/-/g, '').slice(0, 11)}`,
    title,
    description: null,
    durationSeconds: 60,
    status: 'active',
    difficulty: null,
    equipment: [],
    defaultSets: null,
    defaultReps: null,
    defaultDurationSeconds: null,
    defaultRestSeconds: null,
    defaultNotes: null,
    tags: TAGS,
    ...STAMPS,
    ...defaults,
  });

/** One page of the admin video search, holding the given videos */
export const videoSearchPage = (
  videos: { id: string; title: string }[]
): PaginatedAdminVideoResponse =>
  paginatedAdminVideoResponseSchema.parse({
    data: videos.map(({ id, title }) => ({
      id,
      publicId: `v${id.replace(/-/g, '').slice(0, 11)}`,
      title,
      durationSeconds: 60,
      status: 'active',
      difficulty: null,
      equipment: [],
      tags: TAGS,
      description: null,
      isEssential: false,
      ...STAMPS,
    })),
    pagination: { page: 1, pageSize: 10, total: videos.length, totalPages: 1 },
  });
