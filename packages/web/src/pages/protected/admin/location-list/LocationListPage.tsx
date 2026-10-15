import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { LocationListResponse } from '@ffp/core';

import { DeactivateLocationModal } from '@web/components/locations';
import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { ListEmptyStateControls } from '@web/components/templates';
import { useAdminLocationsQuery, useLocationActivation } from '@web/hooks/locations';
import { useAdminOrganisationsQuery } from '@web/hooks/organisations';
import { toActivationRowAction } from '@web/hooks/useActivationActions';
import { RouteKey, routes } from '@web/pages/routes';

import { buildLocationColumns, toLocationRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { LocationListEmptyState } from './LocationListEmptyState';

import type { LocationRow } from './columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };

export const LocationListPage: React.FC = () => {
  const navigate = useNavigate();
  const activation = useLocationActivation<LocationRow>();

  // Fetch all organisations to resolve names for the Organisation column
  const { data: organisationsData } = useAdminOrganisationsQuery(
    { page: 1, pageSize: 100, sortBy: 'name', sortDirection: 'asc' },
    {}
  );

  const organisationMap = useMemo(
    () => Object.fromEntries((organisationsData?.data ?? []).map((org) => [org.id, org.name])),
    [organisationsData]
  );

  const toRow = useCallback(
    (location: LocationListResponse): LocationRow => toLocationRow(location, organisationMap),
    [organisationMap]
  );

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_LOCATION_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: LocationRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_LOCATIONS].path}/${row.publicId}`);
    },
    [navigate]
  );

  const { requestDeactivate, activate } = activation;

  // A suspended location offers Activate, as an inactive one does
  const rowActions = useCallback(
    (row: LocationRow): RowAction<LocationRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
      toActivationRowAction(row.status === 'active', { requestDeactivate, activate }),
    ],
    [handleEditClick, requestDeactivate, activate]
  );

  const locationColumns = useMemo(() => buildLocationColumns(rowActions), [rowActions]);

  const renderEmptyState = useCallback(
    ({ hasActiveControls }: ListEmptyStateControls) => (
      <LocationListEmptyState hasFilters={hasActiveControls} onCreateClick={handleCreateClick} />
    ),
    [handleCreateClick]
  );

  return (
    <AdminListPageShell
      title="Locations"
      subtitle="Manage location sites — create, edit, and control access"
      createLabel="Create Location"
      onCreate={handleCreateClick}
      tableId="admin-locations"
      defaultSort={DEFAULT_SORT}
      filters={TABLE_FILTERS}
      searchPlaceholder="Search by name or account code..."
      useList={useAdminLocationsQuery}
      toRow={toRow}
      columns={locationColumns}
      renderEmptyState={renderEmptyState}
    >
      <DeactivateLocationModal
        isOpen={!!activation.pending}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        locationName={activation.pending?.name ?? ''}
      />
    </AdminListPageShell>
  );
};
