import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { ListEmptyStateControls } from '@web/components/templates';
import { useAdminTemplatesQuery, useUpdateTemplateMutation } from '@web/hooks/programme-templates';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';

import { buildTemplateColumns, toTemplateRow } from './programme-template-list/columns';
import { TABLE_FILTERS } from './programme-template-list/constants';
import { TemplateListEmptyState } from './programme-template-list/TemplateListEmptyState';

import type { TemplateRow } from './programme-template-list/columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };
const DEFAULT_FILTERS = { isActive: 'true' };
const DEFAULT_COLUMN_VISIBILITY = { slug: false };

export const TemplateListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const updateMutation = useUpdateTemplateMutation();

  const handleCreateClick = useCallback((): void => {
    void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/create`);
  }, [navigate]);

  const handleViewClick = useCallback(
    (row: TemplateRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/${row.publicId}`);
    },
    [navigate]
  );

  /** Toggle isActive status via update mutation */
  const handleToggleActive = useCallback(
    (row: TemplateRow): void => {
      const newIsActive = !row.isActive;
      updateMutation.mutate(
        { id: row.id, publicId: row.publicId, data: { isActive: newIsActive } },
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

  const renderEmptyState = useCallback(
    ({ hasNonDefaultControls }: ListEmptyStateControls) => (
      <TemplateListEmptyState
        hasFilters={hasNonDefaultControls}
        onCreateClick={handleCreateClick}
      />
    ),
    [handleCreateClick]
  );

  return (
    <AdminListPageShell
      title="Programme Templates"
      subtitle="Manage programme templates — create, edit, and control availability"
      createLabel="Create Template"
      onCreate={handleCreateClick}
      tableId="admin-templates"
      defaultSort={DEFAULT_SORT}
      defaultFilters={DEFAULT_FILTERS}
      defaultColumnVisibility={DEFAULT_COLUMN_VISIBILITY}
      filters={TABLE_FILTERS}
      searchPlaceholder="Search by name or slug..."
      useList={useAdminTemplatesQuery}
      toRow={toTemplateRow}
      columns={templateColumns}
      renderEmptyState={renderEmptyState}
    />
  );
};
