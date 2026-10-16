import React, { useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';

import type { RowAction } from '@web/components/organisms';
import { DeactivateQuestionModal } from '@web/components/questions';
import { AdminListPageShell } from '@web/components/templates';
import type { AdminListEmptyState } from '@web/components/templates';
import { RouteKey, routes } from '@web/config/routes';
import {
  useAdminQuestionsQuery,
  useQuestionActivation,
  useQuestionDetailQuery,
} from '@web/hooks/questions';
import { toActivationRowAction } from '@web/hooks/useActivationActions';

import { buildQuestionColumns, toQuestionRow } from './columns';
import { QUESTION_TABLE_FILTERS } from './constants';

import type { QuestionRow } from './columns';

const DEFAULT_SORT = { id: 'questionText', desc: false };

const DEFAULT_FILTERS = { isActive: 'true' };

const EMPTY_STATE: AdminListEmptyState = {
  filteredTitle: 'No matching questions',
  icon: 'HelpCircle',
  iconVariant: 'neutral',
  title: 'No questions yet',
  description: 'Write your first question to start building assessments from the bank.',
};

export const QuestionListPage: React.FC = () => {
  const navigate = useNavigate();
  const activation = useQuestionActivation<QuestionRow>();

  // The list carries no usage, so the warning reads it from the question's detail
  const { data: pendingDetail, isError: isUsageCheckFailed } = useQuestionDetailQuery(
    activation.pending?.publicId ?? ''
  );

  const handleCreateClick = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_QUESTION_CREATE].path);
  }, [navigate]);

  const handleEditClick = useCallback(
    (row: QuestionRow): void => {
      void navigate(
        generatePath(routes[RouteKey.ADMIN_QUESTION_EDIT].path, { publicId: row.publicId })
      );
    },
    [navigate]
  );

  const { requestDeactivate, activate } = activation;

  const rowActions = useCallback(
    (row: QuestionRow): RowAction<QuestionRow>[] => [
      {
        label: 'Edit',
        onClick: handleEditClick,
      },
      toActivationRowAction(row.isActive, { requestDeactivate, activate }),
    ],
    [handleEditClick, requestDeactivate, activate]
  );

  const questionColumns = useMemo(() => buildQuestionColumns(rowActions), [rowActions]);

  return (
    <AdminListPageShell
      title="Question Bank"
      subtitle="The questions assessments are built from, and the scores their answers carry"
      createLabel="Create Question"
      onCreate={handleCreateClick}
      tableId="admin-questions"
      defaultSort={DEFAULT_SORT}
      defaultFilters={DEFAULT_FILTERS}
      filters={QUESTION_TABLE_FILTERS}
      searchPlaceholder="Search by question or slug..."
      useList={useAdminQuestionsQuery}
      toRow={toQuestionRow}
      columns={questionColumns}
      emptyState={EMPTY_STATE}
    >
      <DeactivateQuestionModal
        isOpen={!!activation.pending}
        onClose={activation.cancelDeactivate}
        onConfirm={activation.confirmDeactivate}
        isLoading={activation.isDeactivating}
        questionText={activation.pending?.questionText ?? ''}
        usage={pendingDetail?.usage}
        usageCheckFailed={isUsageCheckFailed}
      />
    </AdminListPageShell>
  );
};
