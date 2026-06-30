import { createColumns } from '@web/components/table';
import type { RowAction, StatusConfig } from '@web/components/table';
import { Text } from '@web/components/text';

import { levelTitle } from './prototype-level-model';
import { ROLE_LABELS, type PrototypeUser } from './prototype-users';
import { TagChip } from './TagChip';

import type { ColumnDef } from '@tanstack/react-table';

/** Row type — mirrors the live UserRow (flattened fullName + programme fields for the table). */
export type UserRow = PrototypeUser & {
  fullName: string;
  programmeName: string;
  programmeLevelName: string;
  programmeStatus: string;
} & Record<string, unknown>;

export const PROGRAMME_STATUS_MAP: Partial<Record<string, StatusConfig>> = {
  active: { label: 'Active', colour: 'success' },
  paused: { label: 'Paused', colour: 'warning' },
  completed: { label: 'Completed', colour: 'info' },
  archived: { label: 'Archived', colour: 'grey' },
};

export const toUserRow = (user: PrototypeUser): UserRow => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`,
  programmeName: user.programme?.name ?? '',
  programmeLevelName: user.programme ? levelTitle(user.programme.level) : '',
  programmeStatus: user.programme?.status ?? '',
});

const columns = createColumns<UserRow>();

/**
 * Columns mirror the live Users table; when the role filter is Programme User the
 * programme columns (marked "(new)") are added — the iteration this surface needs.
 */
export const buildUserColumns = (
  showProgramme: boolean,
  actions: (row: UserRow) => RowAction<UserRow>[]
): ColumnDef<UserRow>[] => {
  const base: ColumnDef<UserRow>[] = [
    columns.text('fullName', { label: 'Name', sortable: true }),
    columns.text('email', { label: 'Email', sortable: true }),
    columns.text('locationName', {
      label: 'Location',
      cell: (_value, row) => <Text styleProps={{ size: 'sm' }}>{row.locationName ?? '—'}</Text>,
    }),
    columns.text('role', {
      label: 'Role',
      sortable: true,
      cell: (_value, row) => <Text styleProps={{ size: 'sm' }}>{ROLE_LABELS[row.role]}</Text>,
    }),
  ];

  const programmeColumns: ColumnDef<UserRow>[] = showProgramme
    ? [
        columns.text('programmeName', {
          label: 'Programme (new)',
          cell: (_value, row) => (
            <Text styleProps={{ size: 'sm' }}>{row.programme?.name ?? '—'}</Text>
          ),
        }),
        columns.text('programmeLevelName', {
          label: 'Level (new)',
          cell: (_value, row) =>
            row.programme ? (
              <TagChip label={levelTitle(row.programme.level)} tone="primary" />
            ) : (
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>—</Text>
            ),
        }),
        columns.status('programmeStatus', {
          label: 'Programme status (new)',
          statusMap: PROGRAMME_STATUS_MAP,
        }),
      ]
    : [];

  const tail: ColumnDef<UserRow>[] = [
    columns.date('createdAt', { label: 'Created', sortable: true }),
    columns.actions({ actions }),
  ];

  return [...base, ...programmeColumns, ...tail];
};
