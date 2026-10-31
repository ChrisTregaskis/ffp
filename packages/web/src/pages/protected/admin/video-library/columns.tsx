import type { AdminVideoListResponse } from '@ffp/core';

import { Badge } from '@web/components/atoms';
import { createColumns } from '@web/components/organisms';
import type { RowAction } from '@web/components/organisms';

import { VIDEO_STATUS_MAP } from './constants';
import { VideoTitleCell } from './VideoTitleCell';

import type { ColumnDef } from '@tanstack/react-table';

/**
 * Row type for the admin video list — each tag category's labels pulled out for its column;
 * extends Record<string, unknown> for TanStack Table
 */
export type VideoRow = AdminVideoListResponse & {
  goal: string[];
  movement: string[];
  bodyAreas: string[];
  audience: string[];
} & Record<string, unknown>;

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
  columns.tags('goal', { label: 'Goal', maxVisible: 2 }),
  columns.text('isEssential', {
    label: 'Essential',
    cell: (_value, row) => (row.isEssential ? <Badge label="Essential" variant="success" /> : null),
  }),
  columns.text('difficulty', { label: 'Difficulty', sortable: true }),
  columns.tags('movement', { label: 'Movement', maxVisible: 2 }),
  columns.duration('durationSeconds', { label: 'Duration', sortable: true }),
  columns.tags('bodyAreas', { label: 'Body area', maxVisible: 2 }),
  columns.tags('audience', { label: 'Audience', maxVisible: 2 }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.date('updatedAt', { label: 'Updated', sortable: true }),
  columns.actions({ actions }),
];
