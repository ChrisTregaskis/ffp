import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { RowAction } from '@web/components/organisms';
import { DeactivateTemplateModal } from '@web/components/programme-templates';
import { AdminListPageShell } from '@web/components/templates';
import type { AdminListEmptyState } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import { useAdminTemplatesQuery, useTemplateActivation } from '@web/hooks/programme-templates';
import { toActivationRowAction } from '@web/hooks/useActivationActions';

import { buildTemplateColumns, toTemplateRow } from './columns';
import { TABLE_FILTERS } from './constants';

import type { TemplateRow } from './columns';

const DEFAULT_SORT = { id: 'createdAt', desc: true };

const DEFAULT_FILTERS = { isActive: 'true' };
const DEFAULT_COLUMN_VISIBILITY = { slug: false };

const EMPTY_STATE: AdminListEmptyState = {
  filteredTitle: 'No matching templates',
  icon: 'ClipboardList',
  iconVariant: 'primary',
  title: 'No programme templates yet',
  description: 'Create your first programme template to start building workout programmes.',
};

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
      toActivationRowAction(row.isActive, { requestDeactivate, activate }),
    ],
    [handleViewClick, requestDeactivate, activate]
  );

  const templateColumns = useMemo(() => buildTemplateColumns(rowActions), [rowActions]);

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
      emptyState={EMPTY_STATE}
    >
      <DeactivateTemplateModal
        isOpen={!!activation.pending}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        templateName={activation.pending?.name ?? ''}
      />
    </AdminListPageShell>
  );
};
