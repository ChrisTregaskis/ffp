import React, { useCallback } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import type { AdminQuestionDetail } from '@ffp/core';

import { Button } from '@web/components/atoms';
import { DeactivateQuestionModal } from '@web/components/questions';
import { AdminEditPageShell } from '@web/components/templates';
import {
  useCreateQuestionMutation,
  useQuestionActivation,
  useQuestionDetailQuery,
  useUpdateQuestionMutation,
} from '@web/hooks/questions';
import { useSaveFeedback } from '@web/hooks/useSaveFeedback';
import { RouteKey, routes } from '@web/pages/routes';
import { pluralise } from '@web/utils/string';

import {
  EMPTY_QUESTION_VALUES,
  toCreateQuestionInput,
  toQuestionFormValues,
  toUpdateQuestionInput,
} from './question-form-values';
import { QuestionFormFields } from './QuestionFormFields';

import type { QuestionFormValues } from './types';

const describeUsage = (question: AdminQuestionDetail): string => {
  const { templateCount, scoringFlowCount } = question.usage;

  return `Used on ${pluralise(templateCount, 'template', 'templates')}, scored by ${pluralise(scoringFlowCount, 'flow', 'flows')}`;
};

export const QuestionEditPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { submitError, clearSubmitError, saveCallbacks } = useSaveFeedback();

  const isEditMode = !!publicId;

  const {
    data: question,
    isLoading,
    error,
  } = useQuestionDetailQuery(publicId ?? '', { enabled: isEditMode });

  const createMutation = useCreateQuestionMutation();
  const updateMutation = useUpdateQuestionMutation();

  const handleNavigateBack = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_QUESTIONS].path);
  }, [navigate]);

  const activation = useQuestionActivation<AdminQuestionDetail>({
    onDeactivated: handleNavigateBack,
  });

  const handleCreate = useCallback(
    async (values: QuestionFormValues): Promise<void> => {
      clearSubmitError();

      await createMutation.mutateAsync(
        toCreateQuestionInput(values),
        saveCallbacks('Question created successfully', (created) => {
          void navigate(
            generatePath(routes[RouteKey.ADMIN_QUESTION_EDIT].path, { publicId: created.publicId })
          );
        })
      );
    },
    [clearSubmitError, createMutation, saveCallbacks, navigate]
  );

  const handleUpdate = useCallback(
    async (values: QuestionFormValues): Promise<void> => {
      if (!publicId || !question) {
        return;
      }

      clearSubmitError();

      await updateMutation.mutateAsync(
        { publicId, data: toUpdateQuestionInput(values, question) },
        saveCallbacks('Question updated successfully', handleNavigateBack)
      );
    },
    [publicId, question, clearSubmitError, updateMutation, saveCallbacks, handleNavigateBack]
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  const headerActions =
    isEditMode && question ? (
      question.isActive ? (
        <Button
          variant="destructive"
          onClick={() => {
            activation.requestDeactivate(question);
          }}
        >
          Deactivate
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={() => {
            activation.activate(question);
          }}
          loading={activation.isActivating}
        >
          Reactivate
        </Button>
      )
    ) : undefined;

  return (
    <AdminEditPageShell
      title={isEditMode ? 'Edit Question' : 'Create Question'}
      subtitle={
        isEditMode
          ? question
            ? describeUsage(question)
            : undefined
          : 'Write the question, then set up how members answer it'
      }
      headerActions={headerActions}
      resourceLabel="question"
      listLabel="Question Bank"
      isEditMode={isEditMode}
      isLoading={isLoading}
      loadError={error}
      loadErrorMessage={error?.message ?? 'This question could not be found.'}
      onBack={handleNavigateBack}
      record={question}
      emptyValues={EMPTY_QUESTION_VALUES}
      toFormValues={toQuestionFormValues}
      onCreate={handleCreate}
      onUpdate={handleUpdate}
      footer={
        <DeactivateQuestionModal
          isOpen={!!activation.pending}
          onClose={activation.cancelDeactivate}
          onConfirm={activation.confirmDeactivate}
          isLoading={activation.isDeactivating}
          questionText={question?.questionText ?? ''}
          usage={question?.usage}
        />
      }
    >
      <QuestionFormFields
        isEditMode={isEditMode}
        record={question}
        onCancel={handleNavigateBack}
        isSubmitting={isPending}
        errorMessage={submitError}
      />
    </AdminEditPageShell>
  );
};
