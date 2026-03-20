import type { CustomerListResponse } from '@ffp/core';

import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import { CUSTOMER_STATUS_MAP } from './constants';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the customer list — extends API response with Record for TanStack Table */
export type CustomerRow = CustomerListResponse & Record<string, unknown>;

/** Maps API response to row type */
export const toCustomerRow = (customer: CustomerListResponse): CustomerRow => ({
  ...customer,
});

const columns = createColumns<CustomerRow>();

/**
 * Builds column definitions for the customer list table.
 * Actions are injected by the page component (navigation + mutations).
 */
export const buildCustomerColumns = (
  actions: RowAction<CustomerRow>[] | ((row: CustomerRow) => RowAction<CustomerRow>[])
): ColumnDef<CustomerRow>[] => [
  columns.text('name', { label: 'Name', sortable: true }),
  columns.text('accountCode', { label: 'Account Code' }),
  columns.status('status', { label: 'Status', statusMap: CUSTOMER_STATUS_MAP }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.actions({ actions }),
];
