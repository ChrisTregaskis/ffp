import { useCallback, useMemo } from 'react';

import { Table, TableControls } from '@web/components/table';
import type { RowAction, TableFilterConfig } from '@web/components/table';
import { Text } from '@web/components/text';
import { useApiTable } from '@web/hooks/useApiTable';

import { MemberProgrammesIterationNote } from './MemberProgrammesIterationNote';
import { USERS } from './prototype-users';
import { usePrototypeStore } from './PrototypeStore';
import { buildUserColumns, toUserRow, type UserRow } from './userListColumns';
import { ViewHeader } from './ViewHeader';

const TABLE_FILTERS: TableFilterConfig[] = [
  {
    key: 'role',
    label: 'Roles',
    options: [
      { label: 'Programme User', value: 'programme_user' },
      { label: 'Customer Staff', value: 'customer_owner,customer_admin' },
      { label: 'System Admin', value: 'system_admin' },
    ],
  },
];

const matchesRole = (role: string, filter: string): boolean =>
  filter === '' || filter.split(',').includes(role);

/** Member programmes — the existing Users table, defaulted to Programme User and iterated. */
export const MemberProgrammesView: React.FC = () => {
  const { navigate } = usePrototypeStore();

  const {
    onStateChange,
    queryParams,
    search,
    onSearchChange,
    filterValues,
    onFilterChange,
    debouncedSearch,
    debouncedFilters,
    clearAll,
    hasActiveControls,
  } = useApiTable({
    defaultPageSize: 10,
    defaultSort: { id: 'createdAt', desc: true },
    defaultFilters: { role: 'programme_user' },
  });

  const showProgramme = filterValues.role === 'programme_user';

  const rows = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    const roleFilter = typeof debouncedFilters.role === 'string' ? debouncedFilters.role : '';

    return USERS.filter((user) => {
      const matchesSearch =
        term === '' ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      return matchesSearch && matchesRole(user.role, roleFilter);
    }).map(toUserRow);
  }, [debouncedSearch, debouncedFilters]);

  const sorted = useMemo(() => {
    const { sortBy, sortDirection } = queryParams;

    if (!sortBy) {
      return rows;
    }

    const direction = sortDirection === 'desc' ? -1 : 1;

    return [...rows].sort((a, b) => {
      const aValue = String(a[sortBy] ?? '');
      const bValue = String(b[sortBy] ?? '');

      return aValue.localeCompare(bValue) * direction;
    });
  }, [rows, queryParams]);

  const pageRows = useMemo(() => {
    const start = (queryParams.page - 1) * queryParams.pageSize;

    return sorted.slice(start, start + queryParams.pageSize);
  }, [sorted, queryParams.page, queryParams.pageSize]);

  const rowActions = useCallback(
    (): RowAction<UserRow>[] => [
      {
        label: 'Open programme',
        onClick: (row) => {
          navigate({ name: 'member-programme', memberId: row.id });
        },
        hidden: (row) => row.programme === null,
      },
    ],
    [navigate]
  );

  const userColumns = useMemo(
    () => buildUserColumns(showProgramme, rowActions),
    [showProgramme, rowActions]
  );

  return (
    <div>
      <ViewHeader
        title="Member programmes"
        subtitle="The Users table, defaulted to Programme Users — open a member to view and tune their programme."
      />

      <MemberProgrammesIterationNote />

      <Table<UserRow>
        tableId="prototype-users"
        data={pageRows}
        columns={userColumns}
        totalRows={sorted.length}
        isLoading={false}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        getRowId={(row) => row.id}
        emptyState={
          <div className="px-6 py-10 text-center">
            <Text styleProps={{ colour: 'muted-foreground' }}>
              {hasActiveControls ? 'No users match your search and filters.' : 'No users yet.'}
            </Text>
          </div>
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by name or email..."
            filters={TABLE_FILTERS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />
    </div>
  );
};
