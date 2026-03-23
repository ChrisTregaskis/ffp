import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import {
  useAdminOrganisationsQuery,
  useUpdateOrganisationMutation,
} from '@web/hooks/organisations';
import { useApiTable } from '@web/hooks/useApiTable';
import { useToast } from '@web/hooks/useToast';
import type { AdminOrganisationFilterInput } from '@web/lib/api/endpoints';
import { RouteKey, routes } from '@web/pages/routes';

import { buildOrganisationColumns, toOrganisationRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { OrganisationListEmptyState } from './OrganisationListEmptyState';

import type { OrganisationRow } from './columns';

export const OrganisationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateOrganisationMutation();

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

  const adminFilters: AdminOrganisationFilterInput = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: debouncedFilters.status ? String(debouncedFilters.status) : undefined,
    }),
    [debouncedSearch, debouncedFilters]
  );

  const { data, isLoading, error } = useAdminOrganisationsQuery(queryParams, adminFilters);

  const organisationRows = useMemo(() => (data ? data.data.map(toOrganisationRow) : []), [data]);

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ORGANISATION_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: OrganisationRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_ORGANISATIONS].path}/${row.id}`);
    },
    [navigate]
  );

  /** Toggle organisation status between active and inactive */
  const handleToggleActive = useCallback(
    (row: OrganisationRow): void => {
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

  return (
    <PageContainer>
      <PageHeader
        title="Organisations"
        subtitle="Manage organisations — create, edit, and control access"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreateClick}
          >
            Create Organisation
          </Button>
        }
      />

      <Table<OrganisationRow>
        tableId="admin-organisations"
        data={organisationRows}
        columns={organisationColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        getRowId={(row) => row.id}
        emptyState={
          <OrganisationListEmptyState
            hasFilters={hasActiveControls}
            onCreateClick={handleCreateClick}
          />
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by name..."
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
