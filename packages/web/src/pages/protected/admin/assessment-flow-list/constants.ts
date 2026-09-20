import type { StatusConfig, TableFilterConfig } from '@web/components/table';

export const ASSESSMENT_FLOW_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  inactive: { label: 'Inactive', colour: 'grey' },
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

export const ASSESSMENT_FLOW_TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'isActive', label: 'Status', options: STATUS_FILTER_OPTIONS },
];
