import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { DeactivateOrganisationModal } from '@web/components/organisations';
import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { ListEmptyStateControls } from '@web/components/templates';
import { useAdminOrganisationsQuery, useOrganisationActivation } from '@web/hooks/organisations';
import { toActivationRowAction } from '@web/hooks/useActivationActions';
import { RouteKey, routes } from '@web/pages/routes';

import { buildOrganisationColumns, toOrganisationRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { OrganisationListEmptyState } from './OrganisationListEmptyState';

import type { OrganisationRow } from './columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };

export const OrganisationListPage: React.FC = () => {
  const navigate = useNavigate();
  const activation = useOrganisationActivation<OrganisationRow>();

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ORGANISATION_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: OrganisationRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_ORGANISATIONS].path}/${row.publicId}`);
    },
    [navigate]
  );

  const { requestDeactivate, activate } = activation;

  // A suspended organisation offers Activate, as an inactive one does
  const rowActions = useCallback(
    (row: OrganisationRow): RowAction<OrganisationRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
      toActivationRowAction(row.status === 'active', { requestDeactivate, activate }),
    ],
    [handleEditClick, requestDeactivate, activate]
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
    >
      <DeactivateOrganisationModal
        isOpen={!!activation.pending}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        organisationName={activation.pending?.name ?? ''}
      />
    </AdminListPageShell>
  );
};
