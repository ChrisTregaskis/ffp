import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { useAdminLocationsQuery, useUpdateLocationMutation } from '@web/hooks/locations';
import { useAdminOrganisationsQuery } from '@web/hooks/organisations';
import { useApiTable } from '@web/hooks/useApiTable';
import { useToast } from '@web/hooks/useToast';
import type { AdminLocationFilterInput } from '@web/lib/api/endpoints';
import { RouteKey, routes } from '@web/pages/routes';

import { buildLocationColumns, toLocationRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { LocationListEmptyState } from './LocationListEmptyState';

import type { LocationRow } from './columns';

export const LocationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateLocationMutation();

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
  });

  const adminFilters: AdminLocationFilterInput = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: debouncedFilters.status ? String(debouncedFilters.status) : undefined,
    }),
    [debouncedSearch, debouncedFilters]
  );

  const { data, isLoading, error } = useAdminLocationsQuery(queryParams, adminFilters);

  // Fetch all organisations to resolve names for the Organisation column
  const { data: organisationsData } = useAdminOrganisationsQuery(
    { page: 1, pageSize: 100, sortBy: 'name', sortDirection: 'asc' },
    {}
  );

  const organisationMap = useMemo(
    () => Object.fromEntries((organisationsData?.data ?? []).map((org) => [org.id, org.name])),
    [organisationsData]
  );

  const locationRows = useMemo(
    () => (data ? data.data.map((loc) => toLocationRow(loc, organisationMap)) : []),
    [data, organisationMap]
  );

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_LOCATION_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: LocationRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_LOCATIONS].path}/${row.id}`);
    },
    [navigate]
  );

  /** Toggle location status between active and inactive */
  const handleToggleActive = useCallback(
    (row: LocationRow): void => {
      const newStatus = row.status === 'active' ? 'inactive' : 'active';
      updateMutation.mutate(
        { id: row.id, data: { status: newStatus } },
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

  return (
    <PageContainer>
      <PageHeader
        title="Locations"
        subtitle="Manage location sites — create, edit, and control access"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreateClick}
          >
            Create Location
          </Button>
        }
      />

      <Table<LocationRow>
        tableId="admin-locations"
        data={locationRows}
        columns={locationColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        getRowId={(row) => row.id}
        emptyState={
          <LocationListEmptyState
            hasFilters={hasActiveControls}
            onCreateClick={handleCreateClick}
          />
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by name or account code..."
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
