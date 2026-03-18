import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import { useAdminTemplatesQuery, useUpdateTemplateMutation } from '@web/hooks/programme-templates';
import { useApiTable } from '@web/hooks/useApiTable';
import { useToast } from '@web/hooks/useToast';
import type { AdminTemplateFilterInput } from '@web/lib/api/endpoints';
import { RouteKey, routes } from '@web/pages/routes';

import { buildTemplateColumns, toTemplateRow } from './programme-template-list/columns';
import { TABLE_FILTERS } from './programme-template-list/constants';
import { TemplateListEmptyState } from './programme-template-list/TemplateListEmptyState';

import type { TemplateRow } from './programme-template-list/columns';

export const TemplateListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateTemplateMutation();

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
    defaultFilters: { isActive: 'true' },
  });

  const adminFilters: AdminTemplateFilterInput = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      difficulty: debouncedFilters.difficulty ? String(debouncedFilters.difficulty) : undefined,
      isActive: debouncedFilters.isActive ? String(debouncedFilters.isActive) : undefined,
    }),
    [debouncedSearch, debouncedFilters]
  );

  const { data, isLoading, error } = useAdminTemplatesQuery(queryParams, adminFilters);

  const templateRows = useMemo(() => (data ? data.data.map(toTemplateRow) : []), [data]);

  const handleCreateClick = useCallback((): void => {
    void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/create`);
  }, [navigate]);

  const handleViewClick = useCallback(
    (row: TemplateRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/${row.id}`);
    },
    [navigate]
  );

  /** Toggle isActive status via update mutation */
  const handleToggleActive = useCallback(
    (row: TemplateRow): void => {
      const newIsActive = !row.isActive;
      updateMutation.mutate(
        { id: row.id, data: { isActive: newIsActive } },
        {
          onSuccess: () => {
            const action = newIsActive ? 'activated' : 'deactivated';
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
    (row: TemplateRow): RowAction<TemplateRow>[] => [
      {
        label: 'View Detail',
        onClick: handleViewClick,
      },
      {
        label: row.isActive ? 'Deactivate' : 'Activate',
        onClick: handleToggleActive,
        variant: row.isActive ? 'danger' : 'default',
      },
    ],
    [handleViewClick, handleToggleActive]
  );

  const templateColumns = useMemo(() => buildTemplateColumns(rowActions), [rowActions]);

  return (
    <PageContainer>
      <PageHeader
        title="Programme Templates"
        subtitle="Manage programme templates — create, edit, and control availability"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreateClick}
          >
            Create Template
          </Button>
        }
      />

      <Table<TemplateRow>
        tableId="admin-templates"
        data={templateRows}
        columns={templateColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'createdAt', desc: true }}
        defaultColumnVisibility={{ slug: false, sessionsPerPhase: false }}
        getRowId={(row) => row.id}
        emptyState={
          <TemplateListEmptyState
            hasFilters={hasActiveControls}
            onCreateClick={handleCreateClick}
          />
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by name or slug..."
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
