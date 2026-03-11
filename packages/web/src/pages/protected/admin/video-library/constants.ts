import type { StatusConfig, TableFilterConfig } from '@web/components/table';

export const VIDEO_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  draft: { label: 'Draft', colour: 'grey' },
  active: { label: 'Active', colour: 'success' },
  archived: { label: 'Archived', colour: 'warning' },
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Draft', value: 'draft' },
  { label: 'Active', value: 'active' },
  { label: 'Archived', value: 'archived' },
];

const DIFFICULTY_FILTER_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export const TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'status', label: 'Status', options: STATUS_FILTER_OPTIONS },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_FILTER_OPTIONS },
];
