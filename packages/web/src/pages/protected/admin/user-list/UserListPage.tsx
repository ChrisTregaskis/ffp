import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { useApiTable } from '@web/hooks/useApiTable';
import { useAdminUsersQuery } from '@web/hooks/users';
import type { AdminUserFilterInput } from '@web/lib/api/endpoints';
import { RouteKey, routes } from '@web/pages/routes';

import { buildUserColumns, toUserRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { UserListEmptyState } from './UserListEmptyState';

import type { UserRow } from './columns';

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();

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

  const adminFilters: AdminUserFilterInput = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: debouncedFilters.role ? String(debouncedFilters.role) : undefined,
    }),
    [debouncedSearch, debouncedFilters]
  );

  const { data, isLoading, error } = useAdminUsersQuery(queryParams, adminFilters);

  const userRows = useMemo(() => (data ? data.data.map(toUserRow) : []), [data]);

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_USER_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: UserRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_USERS].path}/${row.publicId}`);
    },
    [navigate]
  );

  const rowActions = useCallback(
    (_row: UserRow): RowAction<UserRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
    ],
    [handleEditClick]
  );

  const userColumns = useMemo(() => buildUserColumns(rowActions), [rowActions]);

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        subtitle="Manage programme users — create, edit, and view user accounts"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreateClick}
          >
            Create User
          </Button>
        }
      />

      <Table<UserRow>
        tableId="admin-users"
        data={userRows}
        columns={userColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        getRowId={(row) => row.id}
        emptyState={
          <UserListEmptyState hasFilters={hasActiveControls} onCreateClick={handleCreateClick} />
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by name or email..."
            searchWidthClass="sm:w-64"
            filters={TABLE_FILTERS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />
    </PageContainer>
  );
};
