import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminListPageShell } from '@web/components/layout';
import type { ListEmptyStateControls } from '@web/components/layout';
import type { RowAction } from '@web/components/table';
import {
  useAdminOrganisationsQuery,
  useUpdateOrganisationMutation,
} from '@web/hooks/organisations';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { buildOrganisationColumns, toOrganisationRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { OrganisationListEmptyState } from './OrganisationListEmptyState';

import type { OrganisationRow } from './columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };

export const OrganisationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateOrganisationMutation();

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ORGANISATION_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: OrganisationRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_ORGANISATIONS].path}/${row.publicId}`);
    },
    [navigate]
  );

  /** Toggle organisation status between active and inactive */
  const handleToggleActive = useCallback(
    (row: OrganisationRow): void => {
      const newStatus = row.status === 'active' ? 'inactive' : 'active';
      updateMutation.mutate(
        { id: row.id, publicId: row.publicId, data: { status: newStatus } },
        {
          onSuccess: () => {
            const action = newStatus === 'active' ? 'activated' : 'deactivated';
            addToast(`"${row.name}" ${action} successfully`, { variant: 'success' });
          },
          onError: (err) => {
            addToast(err.message, { variant: 'error' });
          },
        }
      );
    },
    [updateMutation, addToast]
  );

  const rowActions = useCallback(
    (row: OrganisationRow): RowAction<OrganisationRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
      {
        label: row.status === 'active' ? 'Deactivate' : 'Activate',
        onClick: handleToggleActive,
        variant: row.status === 'active' ? 'danger' : 'default',
      },
    ],
    [handleEditClick, handleToggleActive]
  );

  const organisationColumns = useMemo(() => buildOrganisationColumns(rowActions), [rowActions]);

  const renderEmptyState = useCallback(
    ({ hasActiveControls }: ListEmptyStateControls) => (
      <OrganisationListEmptyState
        hasFilters={hasActiveControls}
        onCreateClick={handleCreateClick}
      />
    ),
    [handleCreateClick]
  );

  return (
    <AdminListPageShell
      title="Organisations"
      subtitle="Manage organisations — create, edit, and control access"
      createLabel="Create Organisation"
      onCreate={handleCreateClick}
      tableId="admin-organisations"
      defaultSort={DEFAULT_SORT}
      filters={TABLE_FILTERS}
      searchPlaceholder="Search by name..."
      useList={useAdminOrganisationsQuery}
      toRow={toOrganisationRow}
      columns={organisationColumns}
      renderEmptyState={renderEmptyState}
    />
  );
};
