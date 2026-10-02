import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminListPageShell } from '@web/components/layout';
import type { ListEmptyStateControls } from '@web/components/layout';
import type { RowAction } from '@web/components/table';
import { useAdminUsersQuery } from '@web/hooks/users';
import { RouteKey, routes } from '@web/pages/routes';

import { buildUserColumns, toUserRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { UserListEmptyState } from './UserListEmptyState';

import type { UserRow } from './columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };
const DEFAULT_FILTERS = { role: 'programme_user' };

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();

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

  // hasActiveControls, not hasNonDefaultControls: the default role narrows to one
  // of three rather than setting a baseline, so an empty result means none of that
  // role. A genuinely empty list reads as filtered too; "All Roles" shows the rest.
  const renderEmptyState = useCallback(
    ({ hasActiveControls }: ListEmptyStateControls) => (
      <UserListEmptyState hasFilters={hasActiveControls} onCreateClick={handleCreateClick} />
    ),
    [handleCreateClick]
  );

  return (
    <AdminListPageShell
      title="Users"
      subtitle="Manage programme users — create, edit, and view user accounts"
      createLabel="Create User"
      onCreate={handleCreateClick}
      tableId="admin-users"
      defaultSort={DEFAULT_SORT}
      defaultFilters={DEFAULT_FILTERS}
      filters={TABLE_FILTERS}
      searchPlaceholder="Search by name or email..."
      searchWidthClass="sm:w-64"
      useList={useAdminUsersQuery}
      toRow={toUserRow}
      columns={userColumns}
      renderEmptyState={renderEmptyState}
    />
  );
};
