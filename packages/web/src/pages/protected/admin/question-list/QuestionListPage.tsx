import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@web/components/button';
import { Icon } from '@web/components/Icon';
import { PageContainer, PageHeader } from '@web/components/layout';
import { DeactivateQuestionModal } from '@web/components/modal';
import { Table, TableControls } from '@web/components/table';
import type { RowAction } from '@web/components/table';
import {
  useAdminQuestionsQuery,
  useDeactivateQuestionMutation,
  useQuestionDetailQuery,
  useUpdateQuestionMutation,
} from '@web/hooks/questions';
import { useApiTable } from '@web/hooks/useApiTable';
import { useToast } from '@web/hooks/useToast';
import type { AdminQuestionFilterInput } from '@web/lib/api/endpoints';
import { RouteKey, routes } from '@web/pages/routes';

import { buildQuestionColumns, toQuestionRow } from './columns';
import { QUESTION_TABLE_FILTERS } from './constants';
import { QuestionListEmptyState } from './QuestionListEmptyState';

import type { QuestionRow } from './columns';

export const QuestionListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const deactivateMutation = useDeactivateQuestionMutation();
  const updateMutation = useUpdateQuestionMutation();

  const [questionPendingDeactivation, setQuestionPendingDeactivation] =
    useState<QuestionRow | null>(null);

  // The list carries no usage, so the warning reads it from the question's detail
  const { data: pendingDetail, isError: isUsageCheckFailed } = useQuestionDetailQuery(
    questionPendingDeactivation?.publicId ?? ''
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
    hasNonDefaultControls,
  } = useApiTable({
    defaultPageSize: 10,
    defaultSort: { id: 'questionText', desc: false },
    defaultFilters: { isActive: 'true' },
  });

  const questionFilters: AdminQuestionFilterInput = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      type: debouncedFilters.type ? String(debouncedFilters.type) : undefined,
      isActive: debouncedFilters.isActive ? String(debouncedFilters.isActive) : undefined,
    }),
    [debouncedSearch, debouncedFilters]
  );

  const { data, isLoading, error } = useAdminQuestionsQuery(queryParams, questionFilters);

  const questionRows = useMemo(() => (data ? data.data.map(toQuestionRow) : []), [data]);

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_QUESTION_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: QuestionRow): void => {
      void navigate(routes[RouteKey.ADMIN_QUESTION_EDIT].path.replace(':publicId', row.publicId));
    },
    [navigate]
  );

  const handleCloseDeactivateModal = useCallback((): void => {
    setQuestionPendingDeactivation(null);
  }, []);

  const handleConfirmDeactivate = useCallback((): void => {
    if (!questionPendingDeactivation) {
      return;
    }

    deactivateMutation.mutate(questionPendingDeactivation.publicId, {
      onSuccess: () => {
        addToast('Question deactivated successfully', { variant: 'success' });
        setQuestionPendingDeactivation(null);
      },
      onError: (err) => {
        addToast(err.message, { variant: 'error' });
        setQuestionPendingDeactivation(null);
      },
    });
  }, [questionPendingDeactivation, deactivateMutation, addToast]);

  const handleActivate = useCallback(
    (row: QuestionRow): void => {
      updateMutation.mutate(
        { publicId: row.publicId, data: { isActive: true } },
        {
          onSuccess: () => {
            addToast('Question activated successfully', { variant: 'success' });
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
    (row: QuestionRow): RowAction<QuestionRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
      row.isActive
        ? {
            label: 'Deactivate',
            onClick: setQuestionPendingDeactivation,
            variant: 'danger',
          }
        : {
            label: 'Activate',
            onClick: handleActivate,
          },
    ],
    [handleEditClick, handleActivate]
  );

  const questionColumns = useMemo(() => buildQuestionColumns(rowActions), [rowActions]);

  return (
    <PageContainer>
      <PageHeader
        title="Question Bank"
        subtitle="The questions assessments are built from, and the scores their answers carry"
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={handleCreateClick}
          >
            Create Question
          </Button>
        }
      />

      <Table<QuestionRow>
        tableId="admin-questions"
        data={questionRows}
        columns={questionColumns}
        totalRows={data?.pagination.total ?? 0}
        isLoading={isLoading}
        error={error?.message}
        onStateChange={onStateChange}
        defaultSort={{ id: 'questionText', desc: false }}
        getRowId={(row) => row.id}
        emptyState={
          <QuestionListEmptyState
            hasFilters={hasNonDefaultControls}
            onCreateClick={handleCreateClick}
          />
        }
        renderControls={(cols) => (
          <TableControls
            search={search}
            onSearchChange={onSearchChange}
            searchPlaceholder="Search by question or slug..."
            filters={QUESTION_TABLE_FILTERS}
            filterValues={filterValues}
            onFilterChange={onFilterChange}
            columns={cols}
            onClearAll={clearAll}
            hasActiveControls={hasActiveControls}
          />
        )}
      />

      <DeactivateQuestionModal
        isOpen={!!questionPendingDeactivation}
        onClose={handleCloseDeactivateModal}
        onConfirm={handleConfirmDeactivate}
        isLoading={deactivateMutation.isPending}
        questionText={questionPendingDeactivation?.questionText ?? ''}
        usage={pendingDetail?.usage}
        usageCheckFailed={isUsageCheckFailed}
      />
    </PageContainer>
  );
};
