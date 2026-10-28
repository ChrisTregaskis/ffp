import type { UserListResponse } from '@ffp/core';

import { Badge } from '@web/components/atoms';
import { createColumns } from '@web/components/organisms';
import type { RowAction, StatusConfig } from '@web/components/organisms';
import { PROGRAMME_STATUS_BADGES } from '@web/components/programme';

import type { ColumnDef } from '@tanstack/react-table';

const GENERATION_FAILED = 'generation_failed';

type ProgrammeState = NonNullable<UserListResponse['programmeStatus']> | typeof GENERATION_FAILED;

/** Row type for the user list — adds computed fullName and programme state for display */
export type UserRow = UserListResponse & {
  fullName: string;
  programmeState: ProgrammeState | null;
} & Record<string, unknown>;

/** Maps API response to row type with computed fields */
export const toUserRow = (user: UserListResponse): UserRow => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
  // A failed generation needs attention even when the member keeps an earlier programme
  programmeState: user.generationFailed ? GENERATION_FAILED : user.programmeStatus,
});

const fromProgrammeBadge = (
  status: NonNullable<UserListResponse['programmeStatus']>
): StatusConfig => ({
  label: PROGRAMME_STATUS_BADGES[status].label,
  colour: PROGRAMME_STATUS_BADGES[status].variant ?? 'muted',
});

const PROGRAMME_STATE_MAP: Record<ProgrammeState, StatusConfig> = {
  active: fromProgrammeBadge('active'),
  paused: fromProgrammeBadge('paused'),
  completed: fromProgrammeBadge('completed'),
  [GENERATION_FAILED]: { label: 'Generation failed', colour: 'destructive' },
};

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
  columns.text('programmeName', { label: 'Programme' }),
  columns.text('programmeLevel', {
    label: 'Level',
    cell: (_value, row) =>
      row.programmeLevel === null ? (
        '-'
      ) : (
        <Badge label={`Level ${String(row.programmeLevel)}`} variant="primary" />
      ),
  }),
  columns.status('programmeState', { label: 'Programme status', statusMap: PROGRAMME_STATE_MAP }),
  columns.date('createdAt', { label: 'Created', sortable: true }),
  columns.actions({ actions }),
];
