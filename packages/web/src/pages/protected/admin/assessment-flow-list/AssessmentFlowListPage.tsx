import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { DeactivateAssessmentFlowModal } from '@web/components/modal';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import {
  useAdminAssessmentFlowsQuery,
  useDeactivateAssessmentFlowMutation,
  useUpdateAssessmentFlowMutation,
} from '@web/hooks/assessment-flows';
import { useApiTable } from '@web/hooks/useApiTable';
import { useToast } from '@web/hooks/useToast';
import type { AdminAssessmentFlowFilterInput } from '@web/lib/api/endpoints';
import { RouteKey, routes } from '@web/pages/routes';

import { AssessmentFlowListEmptyState } from './AssessmentFlowListEmptyState';
import { buildAssessmentFlowColumns, toAssessmentFlowRow } from './columns';
import { ASSESSMENT_FLOW_TABLE_FILTERS } from './constants';

import type { AssessmentFlowRow } from './columns';

export const AssessmentFlowListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const deactivateMutation = useDeactivateAssessmentFlowMutation();
  const updateMutation = useUpdateAssessmentFlowMutation();

  const [flowPendingDeactivation, setFlowPendingDeactivation] = useState<AssessmentFlowRow | null>(
    null
  );

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
    defaultSort: { id: 'name', desc: false },
    defaultFilters: { isActive: 'true' },
  });

  const flowFilters: AdminAssessmentFlowFilterInput = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      isActive: debouncedFilters.isActive ? String(debouncedFilters.isActive) : undefined,
    }),
    [debouncedSearch, debouncedFilters]
  );

  const { data, isLoading, error } = useAdminAssessmentFlowsQuery(queryParams, flowFilters);

  const flowRows = useMemo(() => (data ? data.data.map(toAssessmentFlowRow) : []), [data]);

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_ASSESSMENT_FLOW_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: AssessmentFlowRow): void => {
      void navigate(
        routes[RouteKey.ADMIN_ASSESSMENT_FLOW_EDIT].path.replace(':publicId', row.publicId)
      );
    },
    [navigate]
  );

  const handleCloseDeactivateModal = useCallback((): void => {
    setFlowPendingDeactivation(null);
  }, []);

  const handleConfirmDeactivate = useCallback((): void => {
    if (!flowPendingDeactivation) {
      return;
    }

    const { publicId, name } = flowPendingDeactivation;

    deactivateMutation.mutate(publicId, {
      onSuccess: () => {
        addToast(`"${name}" deactivated successfully`, { variant: 'success' });
        setFlowPendingDeactivation(null);
      },
      onError: (err) => {
        addToast(err.message, { variant: 'error' });
        setFlowPendingDeactivation(null);
      },
    });
  }, [flowPendingDeactivation, deactivateMutation, addToast]);

  const handleActivate = useCallback(
    (row: AssessmentFlowRow): void => {
      updateMutation.mutate(
        { publicId: row.publicId, data: { isActive: true } },
        {
          onSuccess: () => {
            addToast(`"${row.name}" activated successfully`, { variant: 'success' });
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
    (row: AssessmentFlowRow): RowAction<AssessmentFlowRow>[] => [
      {
        label: 'Edit Details',
        onClick: handleEditClick,
      },
      row.isActive
        ? {
            label: 'Deactivate',
            onClick: setFlowPendingDeactivation,
            variant: 'danger',
          }
        : {
            label: 'Activate',
            onClick: handleActivate,
          },
    ],
    [handleEditClick, handleActivate]
  );

  const flowColumns = useMemo(() => buildAssessmentFlowColumns(rowActions), [rowActions]);

  return (
    <PageContainer>
      <PageHeader
        title="Assessment Flows"
        subtitle="Each flow is a sequence of steps that shapes a member's tailored programme"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreateClick}
          >
            Create Flow
          </Button>
        }
      />

      <Table<AssessmentFlowRow>
        tableId="admin-assessment-flows"
        data={flowRows}
        columns={flowColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'name', desc: false }}
        getRowId={(row) => row.id}
        emptyState={
          <AssessmentFlowListEmptyState
            hasFilters={hasActiveControls}
            onCreateClick={handleCreateClick}
          />
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by name or description..."
            filters={ASSESSMENT_FLOW_TABLE_FILTERS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />

      <DeactivateAssessmentFlowModal
        isOpen={!!flowPendingDeactivation}
        onClose={handleCloseDeactivateModal}
        onConfirm={handleConfirmDeactivate}
        isLoading={deactivateMutation.isPending}
        flowName={flowPendingDeactivation?.name ?? ''}
      />
    </PageContainer>
  );
};
