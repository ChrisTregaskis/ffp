import type { StatusConfig, TableFilterConfig } from '@web/components/table';

export const LOCATION_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  suspended: { label: 'Suspended', colour: 'warning' },
  inactive: { label: 'Inactive', colour: 'grey' },
};

export const STATUS_FILTER_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Inactive', value: 'inactive' },
];

export const TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'status', label: 'Status', options: STATUS_FILTER_OPTIONS },
];
