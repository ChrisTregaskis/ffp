import { ACTIVE_STATUS_FILTER } from '@web/components/table';
import type { TableFilterConfig } from '@web/components/table';

const DIFFICULTY_FILTER_OPTIONS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export const TABLE_FILTERS: TableFilterConfig[] = [
  ACTIVE_STATUS_FILTER,
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_FILTER_OPTIONS },
];
