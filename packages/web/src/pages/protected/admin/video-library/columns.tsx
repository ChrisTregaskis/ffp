import type { AdminVideoListResponse } from '@ffp/core';

import { createColumns } from '@web/components/table';

import { VIDEO_STATUS_MAP } from './constants';
import { VideoTitleCell } from './VideoTitleCell';

/** Row type for the admin video list — extends Record<string, unknown> for TanStack Table */
export type VideoRow = AdminVideoListResponse & Record<string, unknown>;

const columns = createColumns<VideoRow>();

export const videoColumns = [
  {
    ...columns.text('title', {
      label: 'Video',
      sortable: true,
      cell: (_value, row) => <VideoTitleCell title={row.title} description={row.description} />,
    }),
    size: 280,
    minSize: 200,
  },
  columns.status('status', { label: 'Status', sortable: true, statusMap: VIDEO_STATUS_MAP }),
  columns.text('difficulty', { label: 'Difficulty', sortable: true }),
  columns.text('movementType', { label: 'Movement Type' }),
  columns.duration('durationSeconds', { label: 'Duration', sortable: true }),
  columns.tags('bodyParts', { label: 'Body Parts', maxVisible: 2 }),
  columns.tags('tags', { label: 'Tags', maxVisible: 2 }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.date('updatedAt', { label: 'Updated', sortable: true }),
];
