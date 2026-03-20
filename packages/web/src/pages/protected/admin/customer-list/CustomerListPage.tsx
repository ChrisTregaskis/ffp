import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { useAdminCustomersQuery, useUpdateCustomerMutation } from '@web/hooks/customers';
import { useApiTable } from '@web/hooks/useApiTable';
import { useToast } from '@web/hooks/useToast';
import type { AdminCustomerFilterInput } from '@web/lib/api/endpoints';
import { RouteKey, routes } from '@web/pages/routes';

import { buildCustomerColumns, toCustomerRow } from './columns';
import { TABLE_FILTERS } from './constants';
import { CustomerListEmptyState } from './CustomerListEmptyState';

import type { CustomerRow } from './columns';

export const CustomerListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateCustomerMutation();

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

  const adminFilters: AdminCustomerFilterInput = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: debouncedFilters.status ? String(debouncedFilters.status) : undefined,
    }),
    [debouncedSearch, debouncedFilters]
  );

  const { data, isLoading, error } = useAdminCustomersQuery(queryParams, adminFilters);

  const customerRows = useMemo(() => (data ? data.data.map(toCustomerRow) : []), [data]);

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_CUSTOMER_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: CustomerRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_CUSTOMERS].path}/${row.id}`);
    },
    [navigate]
  );

  /** Toggle customer status between active and inactive */
  const handleToggleActive = useCallback(
    (row: CustomerRow): void => {
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
    (row: CustomerRow): RowAction<CustomerRow>[] => [
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

  const customerColumns = useMemo(() => buildCustomerColumns(rowActions), [rowActions]);

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        subtitle="Manage customer organisations — create, edit, and control access"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreateClick}
          >
            Create Customer
          </Button>
        }
      />

      <Table<CustomerRow>
        tableId="admin-customers"
        data={customerRows}
        columns={customerColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        getRowId={(row) => row.id}
        emptyState={
          <CustomerListEmptyState
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
