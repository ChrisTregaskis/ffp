import type { TableFilterConfig } from '@web/components/table';

const ROLE_FILTER_OPTIONS = [
  { label: 'Programme User', value: 'programme_user' },
  { label: 'Customer Staff', value: 'customer_owner,customer_admin' },
  { label: 'System Admin', value: 'system_admin' },
];

export const TABLE_FILTERS: TableFilterConfig[] = [
  { key: 'role', label: 'Roles', options: ROLE_FILTER_OPTIONS, widthClass: 'sm:w-48' },
];
