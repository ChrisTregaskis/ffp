import React, { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import type { AdminQuestionDetail } from '@ffp/core';

import { Button } from '@web/components/button';
import { AdminEditPageShell } from '@web/components/layout';
import { DeactivateQuestionModal } from '@web/components/modal';
import {
  useCreateQuestionMutation,
  useDeactivateQuestionMutation,
  useQuestionDetailQuery,
  useUpdateQuestionMutation,
} from '@web/hooks/questions';
import { useToast } from '@web/hooks/useToast';
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
  const { addToast } = useToast();

  const isEditMode = !!publicId;

  const {
    data: question,
    isLoading,
    error,
  } = useQuestionDetailQuery(publicId ?? '', { enabled: isEditMode });

  const createMutation = useCreateQuestionMutation();
  const updateMutation = useUpdateQuestionMutation();
  const deactivateMutation = useDeactivateQuestionMutation();

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

  const handleNavigateBack = useCallback((): void => {
    void navigate(routes[RouteKey.ADMIN_QUESTIONS].path);
  }, [navigate]);

  const handleCreate = useCallback(
    async (values: QuestionFormValues): Promise<void> => {
      setSubmitError(null);

      await createMutation.mutateAsync(toCreateQuestionInput(values), {
        onSuccess: (created) => {
          addToast('Question created successfully', { variant: 'success' });
          void navigate(
            routes[RouteKey.ADMIN_QUESTION_EDIT].path.replace(':publicId', created.publicId)
          );
        },
        onError: (err) => {
          setSubmitError(err.message);
        },
      });
    },
    [createMutation, addToast, navigate]
  );

  const handleUpdate = useCallback(
    async (values: QuestionFormValues): Promise<void> => {
      if (!publicId || !question) {
        return;
      }

      setSubmitError(null);

      await updateMutation.mutateAsync(
        { publicId, data: toUpdateQuestionInput(values, question) },
        {
          onSuccess: () => {
            addToast('Question updated successfully', { variant: 'success' });
            handleNavigateBack();
          },
          onError: (err) => {
            setSubmitError(err.message);
          },
        }
      );
    },
    [publicId, question, updateMutation, addToast, handleNavigateBack]
  );

  const handleOpenDeactivateModal = useCallback((): void => {
    setIsDeactivateModalOpen(true);
  }, []);

  const handleCloseDeactivateModal = useCallback((): void => {
    setIsDeactivateModalOpen(false);
  }, []);

  const handleConfirmDeactivate = useCallback((): void => {
    if (!publicId) {
      return;
    }

    deactivateMutation.mutate(publicId, {
      onSuccess: () => {
        addToast('Question deactivated successfully', { variant: 'success' });
        setIsDeactivateModalOpen(false);
        handleNavigateBack();
      },
      onError: (err) => {
        addToast(err.message, { variant: 'error' });
        setIsDeactivateModalOpen(false);
      },
    });
  }, [publicId, deactivateMutation, addToast, handleNavigateBack]);

  const handleReactivate = useCallback((): void => {
    if (!publicId) {
      return;
    }

    updateMutation.mutate(
      { publicId, data: { isActive: true } },
      {
        onSuccess: () => {
          addToast('Question reactivated successfully', { variant: 'success' });
        },
        onError: (err) => {
          addToast(err.message, { variant: 'error' });
        },
      }
    );
  }, [publicId, updateMutation, addToast]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const headerActions =
    isEditMode && question ? (
      question.isActive ? (
        <Button variant="destructive" onClick={handleOpenDeactivateModal}>
          Deactivate
        </Button>
      ) : (
        <Button variant="secondary" onClick={handleReactivate} loading={updateMutation.isPending}>
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
          isOpen={isDeactivateModalOpen}
          onClose={handleCloseDeactivateModal}
          onConfirm={handleConfirmDeactivate}
          isLoading={deactivateMutation.isPending}
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
