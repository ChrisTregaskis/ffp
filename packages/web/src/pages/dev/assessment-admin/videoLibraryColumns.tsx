import { createColumns } from '@web/components/table';
import type { RowAction, StatusConfig } from '@web/components/table';

import { type PrototypeVideo } from './prototype-videos';
import { VideoEssentialCell } from './VideoEssentialCell';
import { VideoGoalCell } from './VideoGoalCell';
import { VideoLibraryTitleCell } from './VideoLibraryTitleCell';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the video table — extends Record<string, unknown> for TanStack Table. */
export type VideoRow = PrototypeVideo & Record<string, unknown>;

export const VIDEO_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  draft: { label: 'Draft', colour: 'grey' },
  active: { label: 'Active', colour: 'success' },
  archived: { label: 'Archived', colour: 'warning' },
};

const columns = createColumns<VideoRow>();

/**
 * Columns mirror the live video library, with two additions marked "(new)" — the
 * Goal axis and the Essential marker the programme model needs.
 */
export const buildVideoColumns = (
  actions: RowAction<VideoRow>[] | ((row: VideoRow) => RowAction<VideoRow>[])
): ColumnDef<VideoRow>[] => [
  {
    ...columns.text('title', {
      label: 'Video',
      sortable: true,
      cell: (_value, row) => (
        <VideoLibraryTitleCell title={row.title} description={row.description} />
      ),
    }),
    size: 280,
    minSize: 200,
  },
  columns.status('status', { label: 'Status', sortable: true, statusMap: VIDEO_STATUS_MAP }),
  columns.text('difficulty', { label: 'Difficulty', sortable: true }),
  columns.text('movementType', { label: 'Movement Type' }),
  // --- Additions for the programme model ---
  columns.text('goals', {
    label: 'Goal (new)',
    cell: (_value, row) => <VideoGoalCell goals={row.goals} />,
  }),
  columns.text('essential', {
    label: 'Essential (new)',
    align: 'center',
    cell: (_value, row) => <VideoEssentialCell essential={row.essential} />,
  }),
  // --- Existing columns ---
  columns.duration('durationSeconds', { label: 'Duration', sortable: true }),
  columns.tags('bodyParts', { label: 'Body Parts', maxVisible: 2 }),
  columns.tags('tags', { label: 'Tags', maxVisible: 2 }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.actions({ actions }),
];
