import type { TableFilterConfig } from './TableControls';
import type { StatusConfig } from './types';

/** Status badges for a list whose rows are active or inactive. */
export const ACTIVE_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  inactive: { label: 'Inactive', colour: 'grey' },
};

/** A filter on the API's `isActive=true|false` query parameter. */
export const ACTIVE_STATUS_FILTER: TableFilterConfig = {
  key: 'isActive',
  label: 'Status',
  options: [
    { label: 'Active', value: 'true' },
    { label: 'Inactive', value: 'false' },
  ],
};

/** The status key a row's `isActive` flag shows under in `ACTIVE_STATUS_MAP`. */
export const toActiveStatus = (isActive: boolean): 'active' | 'inactive' =>
  isActive ? 'active' : 'inactive';
