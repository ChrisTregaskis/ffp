import type { AdminVideoListResponse } from '@ffp/core';

import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import { VIDEO_STATUS_MAP } from './constants';
import { VideoTitleCell } from './VideoTitleCell';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the admin video list — extends Record<string, unknown> for TanStack Table */
export type VideoRow = AdminVideoListResponse & Record<string, unknown>;

const columns = createColumns<VideoRow>();

/**
 * Build column definitions for the admin video list table.
 * Accepts row actions to enable Edit/Publish/Archive quick-actions.
 */
export const buildVideoColumns = (
  actions: RowAction<VideoRow>[] | ((row: VideoRow) => RowAction<VideoRow>[])
): ColumnDef<VideoRow>[] => [
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
  columns.actions({ actions }),
];
