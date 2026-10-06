import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { LocationListResponse } from '@ffp/core';

import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { ListEmptyStateControls } from '@web/components/templates';
import { useAdminLocationsQuery, useUpdateLocationMutation } from '@web/hooks/locations';
import { useAdminOrganisationsQuery } from '@web/hooks/organisations';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { buildLocationColumns, toLocationRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { LocationListEmptyState } from './LocationListEmptyState';

import type { LocationRow } from './columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };

export const LocationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateLocationMutation();

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

  /** Toggle location status between active and inactive */
  const handleToggleActive = useCallback(
    (row: LocationRow): void => {
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
    (row: LocationRow): RowAction<LocationRow>[] => [
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
    />
  );
};
