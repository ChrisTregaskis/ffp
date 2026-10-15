import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { ConfirmModal } from '@web/components/organisms';
import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { ListEmptyStateControls } from '@web/components/templates';
import { useAdminTemplatesQuery, useTemplateActivation } from '@web/hooks/programme-templates';
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
  const activation = useTemplateActivation<TemplateRow>();

  const handleCreateClick = useCallback((): void => {
    void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/create`);
  }, [navigate]);

  const handleViewClick = useCallback(
    (row: TemplateRow): void => {
      void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/${row.publicId}`);
    },
    [navigate]
  );

  const { requestDeactivate, activate } = activation;

  const rowActions = useCallback(
    (row: TemplateRow): RowAction<TemplateRow>[] => [
      {
        label: 'View Detail',
        onClick: handleViewClick,
      },
      row.isActive
        ? {
            label: 'Deactivate',
            onClick: requestDeactivate,
            variant: 'danger',
          }
        : {
            label: 'Activate',
            onClick: activate,
          },
    ],
    [handleViewClick, requestDeactivate, activate]
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
    >
      <ConfirmModal
        isOpen={!!activation.pending}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        title="Deactivate Template"
        subtitle={activation.pending?.name}
        message="Members will no longer be given this programme. Its phases and sessions are kept, so you can activate it again later."
        confirmLabel="Deactivate Template"
      />
    </AdminListPageShell>
  );
};
