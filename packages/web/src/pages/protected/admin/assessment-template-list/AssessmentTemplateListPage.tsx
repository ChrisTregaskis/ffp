import React, { useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';

import { DeactivateAssessmentTemplateModal } from '@web/components/assessment-templates';
import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { AdminListEmptyState } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import {
  useAdminAssessmentTemplatesQuery,
  useAssessmentTemplateActivation,
} from '@web/hooks/assessment-templates';
import { toActivationRowAction } from '@web/hooks/useActivationActions';

import { buildAssessmentTemplateColumns, toAssessmentTemplateRow } from './columns';
import { ASSESSMENT_TEMPLATE_TABLE_FILTERS } from './constants';

import type { AssessmentTemplateRow } from './columns';

const DEFAULT_SORT = { id: 'name', desc: false };

const DEFAULT_FILTERS = { isActive: 'true' };

const EMPTY_STATE: AdminListEmptyState = {
  filteredTitle: 'No matching templates',
  icon: 'CheckCircle',
  iconVariant: 'primary',
  title: 'No assessment templates yet',
  description: 'Create a template to group questions from the bank into a step members answer.',
};

export const AssessmentTemplateListPage: React.FC = () => {
  const navigate = useNavigate();
  const activation = useAssessmentTemplateActivation<AssessmentTemplateRow>();

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENT_TEMPLATE_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: AssessmentTemplateRow): void => {
      void navigate(
        generatePath(routes[RouteKey.ADMIN_ASSESSMENT_TEMPLATE_EDIT].path, {
          publicId: row.publicId,
        })
      );
    },
    [navigate]
  );

  const { requestDeactivate, activate } = activation;

  const rowActions = useCallback(
    (row: AssessmentTemplateRow): RowAction<AssessmentTemplateRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
      toActivationRowAction(row.isActive, { requestDeactivate, activate }),
    ],
    [handleEditClick, requestDeactivate, activate]
  );

  const templateColumns = useMemo(() => buildAssessmentTemplateColumns(rowActions), [rowActions]);

  return (
    <AdminListPageShell
      title="Assessment Templates"
      subtitle="Each template groups questions from the bank into a step members answer"
      createLabel="Create Template"
      onCreate={handleCreateClick}
      tableId="admin-assessment-templates"
      defaultSort={DEFAULT_SORT}
      defaultFilters={DEFAULT_FILTERS}
      filters={ASSESSMENT_TEMPLATE_TABLE_FILTERS}
      searchPlaceholder="Search by name or description..."
      useList={useAdminAssessmentTemplatesQuery}
      toRow={toAssessmentTemplateRow}
      columns={templateColumns}
      emptyState={EMPTY_STATE}
    >
      <DeactivateAssessmentTemplateModal
        isOpen={!!activation.pending}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        templateName={activation.pending?.name ?? ''}
      />
    </AdminListPageShell>
  );
};
