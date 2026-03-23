import type { LocationListResponse } from '@ffp/core';

import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import { LOCATION_STATUS_MAP } from './constants';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the location list — extends API response with organisation name */
export type LocationRow = LocationListResponse & { organisationName: string } & Record<
    string,
    unknown
  >;

/** Maps API response to row type with resolved organisation name */
export const toLocationRow = (
  location: LocationListResponse,
  organisationMap: Record<string, string>
): LocationRow => ({
  ...location,
  organisationName: organisationMap[location.organisationId] ?? '',
});

const columns = createColumns<LocationRow>();

/**
 * Builds column definitions for the location list table.
 * Actions are injected by the page component (navigation + mutations).
 */
export const buildLocationColumns = (
  actions: RowAction<LocationRow>[] | ((row: LocationRow) => RowAction<LocationRow>[])
): ColumnDef<LocationRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.text('organisationName', { label: 'Organisation' }),
  columns.text('accountCode', { label: 'Account Code' }),
  columns.status('status', { label: 'Status', statusMap: LOCATION_STATUS_MAP }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.actions({ actions }),
];
