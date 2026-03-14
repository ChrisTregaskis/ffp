import type { StatusConfig, TableFilterConfig } from '@web/components/table';

export const TEMPLATE_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  inactive: { label: 'Inactive', colour: 'grey' },
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const DIFFICULTY_FILTER_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export const TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'isActive', label: 'Status', options: STATUS_FILTER_OPTIONS },
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_FILTER_OPTIONS },
];
