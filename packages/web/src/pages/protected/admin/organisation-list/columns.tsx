import type { OrganisationListResponse } from '@ffp/core';

import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import { ORGANISATION_STATUS_MAP } from './constants';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the organisation list — extends API response with Record for TanStack Table */
export type OrganisationRow = OrganisationListResponse & Record<string, unknown>;

/** Maps API response to row type */
export const toOrganisationRow = (organisation: OrganisationListResponse): OrganisationRow => ({
  ...organisation,
});

const columns = createColumns<OrganisationRow>();

/**
 * Builds column definitions for the organisation list table.
 * Actions are injected by the page component (navigation + mutations).
 */
export const buildOrganisationColumns = (
  actions: RowAction<OrganisationRow>[] | ((row: OrganisationRow) => RowAction<OrganisationRow>[])
): ColumnDef<OrganisationRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.status('status', { label: 'Status', statusMap: ORGANISATION_STATUS_MAP }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.actions({ actions }),
];
