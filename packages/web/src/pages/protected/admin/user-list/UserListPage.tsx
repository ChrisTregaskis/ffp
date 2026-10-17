import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { AdminListEmptyState } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import { useAdminUsersQuery } from '@web/hooks/users';

import { buildUserColumns, toUserRow } from './columns';
import { TABLE_FILTERS } from './constants';

import type { UserRow } from './columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };
const DEFAULT_FILTERS = { role: 'programme_user' };

const EMPTY_STATE: AdminListEmptyState = {
  filteredTitle: 'No matching users',
  icon: 'Users',
  iconVariant: 'primary',
  title: 'No users yet',
  description: 'Create your first programme user to start onboarding.',
  // The default role narrows to one of three rather than setting a baseline, so an empty
  // result means none of that role; "All Roles" shows the rest
  defaultsNarrow: true,
};

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
      emptyState={EMPTY_STATE}
    />
  );
};
