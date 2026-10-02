import { QUESTION_TYPE_OPTIONS } from '@web/components/questions';
import type { StatusConfig, TableFilterConfig } from '@web/components/table';

export const QUESTION_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  inactive: { label: 'Inactive', colour: 'grey' },
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

export const QUESTION_TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'type', label: 'Type', options: QUESTION_TYPE_OPTIONS, widthClass: 'sm:w-48' },
  { key: 'isActive', label: 'Status', options: STATUS_FILTER_OPTIONS },
];
