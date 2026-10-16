import { ACTIVE_STATUS_FILTER } from '@web/components/organisms';
import type { TableFilterConfig } from '@web/components/organisms';
import { DIFFICULTY_OPTIONS } from '@web/constants';

export const TABLE_FILTERS: TableFilterConfig[] = [
  ACTIVE_STATUS_FILTER,
  { key: 'difficulty', label: 'Difficulty', options: DIFFICULTY_OPTIONS },
];
