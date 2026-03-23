import type { UserListResponse } from '@ffp/core';

import { createColumns } from '@web/components/table';
import type { RowAction } from '@web/components/table';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type for the user list — adds computed fullName for display */
export type UserRow = UserListResponse & { fullName: string } & Record<string, unknown>;

/** Maps API response to row type with computed fields */
export const toUserRow = (user: UserListResponse): UserRow => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
});

const columns = createColumns<UserRow>();

const ROLE_LABELS: Record<string, string> = {
  programme_user: 'Programme User',
  customer_owner: 'Customer Owner',
  customer_admin: 'Customer Admin',
  system_admin: 'System Admin',
};

/**
 * Builds column definitions for the user list table.
 * Actions are injected by the page component (navigation + mutations).
 */
export const buildUserColumns = (
  actions: RowAction<UserRow>[] | ((row: UserRow) => RowAction<UserRow>[])
): ColumnDef<UserRow>[] => [
  columns.text('fullName', { label: 'Name', sortable: true }),
  columns.text('email', { label: 'Email', sortable: true }),
  columns.text('locationName', { label: 'Location' }),
  columns.text('role', {
    label: 'Role',
    cell: (value) => ROLE_LABELS[value as string] ?? String(value),
  }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.actions({ actions }),
];
