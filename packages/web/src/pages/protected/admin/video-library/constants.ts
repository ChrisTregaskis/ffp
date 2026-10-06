import type { StatusConfig, TableFilterConfig } from '@web/components/organisms';
import { DIFFICULTY_OPTIONS } from '@web/constants';

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

export const TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'status', label: 'Status', options: STATUS_FILTER_OPTIONS },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_OPTIONS },
];
