import React, { useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';

import { DeactivateAssessmentFlowModal } from '@web/components/assessment-flows';
import type { RowAction } from '@web/components/organisms';
import { AdminListPageShell } from '@web/components/templates';
import type { AdminListEmptyState } from '@web/components/templates';
import {
  useAdminAssessmentFlowsQuery,
  useAssessmentFlowActivation,
} from '@web/hooks/assessment-flows';
import { toActivationRowAction } from '@web/hooks/useActivationActions';
import { RouteKey, routes } from '@web/pages/routes';

import { buildAssessmentFlowColumns, toAssessmentFlowRow } from './columns';
import { ASSESSMENT_FLOW_TABLE_FILTERS } from './constants';

import type { AssessmentFlowRow } from './columns';

const DEFAULT_SORT = { id: 'name', desc: false };

const DEFAULT_FILTERS = { isActive: 'true' };

const EMPTY_STATE: AdminListEmptyState = {
  filteredTitle: 'No matching flows',
  icon: 'ClipboardList',
  iconVariant: 'neutral',
  title: 'No assessment flows yet',
  description: 'Create your first flow to start shaping the wellness journey members take.',
};

export const AssessmentFlowListPage: React.FC = () => {
  const navigate = useNavigate();
  const activation = useAssessmentFlowActivation<AssessmentFlowRow>();

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: AssessmentFlowRow): void => {
      void navigate(
        generatePath(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_EDIT].path, { publicId: row.publicId })
      );
    },
    [navigate]
  );

  const handleEditStepsClick = useCallback(
    (row: AssessmentFlowRow): void => {
      void navigate(
        generatePath(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_STEPS].path, { publicId: row.publicId })
      );
    },
    [navigate]
  );

  const { requestDeactivate, activate } = activation;

  const rowActions = useCallback(
    (row: AssessmentFlowRow): RowAction<AssessmentFlowRow>[] => [
      {
        label: 'Edit Details',
        onClick: handleEditClick,
      },
      {
        label: 'Edit Steps',
        onClick: handleEditStepsClick,
      },
      toActivationRowAction(row.isActive, { requestDeactivate, activate }),
    ],
    [handleEditClick, handleEditStepsClick, requestDeactivate, activate]
  );

  const flowColumns = useMemo(() => buildAssessmentFlowColumns(rowActions), [rowActions]);

  return (
    <AdminListPageShell
      title="Assessment Flows"
      subtitle="Each flow is a sequence of steps that shapes a member's tailored programme"
      createLabel="Create Flow"
      onCreate={handleCreateClick}
      tableId="admin-assessment-flows"
      defaultSort={DEFAULT_SORT}
      defaultFilters={DEFAULT_FILTERS}
      filters={ASSESSMENT_FLOW_TABLE_FILTERS}
      searchPlaceholder="Search by name or description..."
      useList={useAdminAssessmentFlowsQuery}
      toRow={toAssessmentFlowRow}
      columns={flowColumns}
      emptyState={EMPTY_STATE}
    >
      <DeactivateAssessmentFlowModal
        isOpen={!!activation.pending}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        flowName={activation.pending?.name ?? ''}
      />
    </AdminListPageShell>
  );
};
