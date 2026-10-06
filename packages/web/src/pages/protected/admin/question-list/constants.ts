import { ACTIVE_STATUS_FILTER } from '@web/components/organisms';
import type { TableFilterConfig } from '@web/components/organisms';
import { QUESTION_TYPE_OPTIONS } from '@web/components/questions';

export const QUESTION_TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'type', label: 'Type', options: QUESTION_TYPE_OPTIONS, widthClass: 'sm:w-48' },
  ACTIVE_STATUS_FILTER,
];
