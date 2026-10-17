import React, { useCallback, useState } from 'react';
import { generatePath, useNavigate } from 'react-router-dom';

import type { TemplateQuestionResponse } from '@ffp/core';

import { Button, ContentPanel, Icon, Icons, Text, Title } from '@web/components/atoms';
import { EmptyState, StaticAlert } from '@web/components/molecules';
import { RouteKey, routes } from '@web/config/routes';
import {
  useAssignTemplateQuestionsMutation,
  useReorderTemplateQuestionsMutation,
  useUnassignTemplateQuestionMutation,
} from '@web/hooks/assessment-templates';
import { useToast } from '@web/hooks/useToast';
import { ApiError } from '@web/lib/api/client';
import type { AdminAssessmentTemplateDetail } from '@web/lib/api/endpoints';
import { swapAdjacentItem } from '@web/utils/reorder';

import { AssignQuestionsModal } from './AssignQuestionsModal';
import { TemplateQuestionRow } from './TemplateQuestionRow';
import { UnassignQuestionModal } from './UnassignQuestionModal';

const ALREADY_ASSIGNED_MESSAGE =
  'Some of those questions were already on this template, so nothing was added. The list has been refreshed; choose again.';

/**
 * Nothing pins the questions a member's assessment started with, so a change
 * here reaches anyone part-way through a flow that uses the template.
 */
const recompositionMessage = (flowNames: string[]): string =>
  `Used in ${flowNames.join(', ')}. Changes here apply straight away, including to members part-way through an assessment: the next time they reach these questions they see the new set and order. Answers they have already given are kept, but a required question added here must be answered before anyone who has already answered this template can finish.`;

export interface TemplateQuestionsPanelProps {
  template: AdminAssessmentTemplateDetail;
}

/** The questions a template holds, in order: add from the bank, move, and remove. */
export const TemplateQuestionsPanel: React.FC<TemplateQuestionsPanelProps> = ({ template }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<TemplateQuestionResponse | null>(null);

  const assign = useAssignTemplateQuestionsMutation(template.publicId);
  const unassign = useUnassignTemplateQuestionMutation(template.publicId);
  const reorder = useReorderTemplateQuestionsMutation(template.publicId);

  const isMutating = assign.isPending || unassign.isPending || reorder.isPending;
  const questions = template.templateQuestions;

  const handleAssign = useCallback(
    (questionPublicIds: string[]): void => {
      assign.mutate(questionPublicIds, {
        onSuccess: () => {
          addToast(
            questionPublicIds.length === 1
              ? 'Question added'
              : `${String(questionPublicIds.length)} questions added`,
            { variant: 'success' }
          );
          setIsPickerOpen(false);
        },
        onError: (err) => {
          // The picker only offers unassigned questions, so a conflict means its pool was stale
          const conflict = ApiError.isApiError(err) && err.status === 409;

          addToast(conflict ? ALREADY_ASSIGNED_MESSAGE : err.message, {
            variant: conflict ? 'info' : 'error',
          });
        },
      });
    },
    [assign, addToast]
  );

  const handleMove = useCallback(
    (questionPublicId: string, direction: 'up' | 'down'): void => {
      // The endpoint takes the whole assigned set, so the payload is built from what is rendered
      const orderedQuestionPublicIds = swapAdjacentItem(
        questions.map((question) => question.publicId),
        questionPublicId,
        direction
      );

      if (!orderedQuestionPublicIds) {
        return;
      }

      reorder.mutate(orderedQuestionPublicIds, {
        onSuccess: () => addToast('Question order updated', { variant: 'success' }),
        onError: (err) => addToast(err.message, { variant: 'error' }),
      });
    },
    [questions, reorder, addToast]
  );

  const handleConfirmRemoval = useCallback((): void => {
    if (!pendingRemoval) {
      return;
    }

    unassign.mutate(pendingRemoval.publicId, {
      onSuccess: () => {
        addToast('Question removed from this template', { variant: 'success' });
        setPendingRemoval(null);
      },
      onError: (err) => addToast(err.message, { variant: 'error' }),
    });
  }, [pendingRemoval, unassign, addToast]);

  const handleOpenQuestion = useCallback(
    (questionPublicId: string): void => {
      void navigate(
        generatePath(routes[RouteKey.ADMIN_QUESTION_EDIT].path, { publicId: questionPublicId })
      );
    },
    [navigate]
  );

  const handleMoveUp = useCallback(
    (questionPublicId: string): void => {
      handleMove(questionPublicId, 'up');
    },
    [handleMove]
  );

  const handleMoveDown = useCallback(
    (questionPublicId: string): void => {
      handleMove(questionPublicId, 'down');
    },
    [handleMove]
  );

  const openPicker = (): void => {
    setIsPickerOpen(true);
  };

  return (
    <ContentPanel>
      <section className="mt-10 border-t border-border pt-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <Title as="h2">Questions</Title>
            <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
              Members are asked these in this order.
            </Text>
          </div>
          <Button
            variant="primary"
            icon={<Icon name={Icons.PLUS} styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={openPicker}
            disabled={isMutating}
          >
            Add Questions
          </Button>
        </div>

        {template.flows.length > 0 ? (
          <StaticAlert
            variant="warning"
            appearance="soft"
            message={recompositionMessage(template.flows.map((flow) => flow.name))}
            className="mb-4"
          />
        ) : (
          <StaticAlert
            variant="info"
            appearance="soft"
            message="No flow uses this template yet, so changes here reach no one until a flow step links it."
            className="mb-4"
          />
        )}

        {questions.length === 0 ? (
          <EmptyState
            message="No questions yet. Add some from the question bank."
            action={
              <Button variant="secondary" size="sm" onClick={openPicker}>
                + Add Questions
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <TemplateQuestionRow
                key={question.publicId}
                question={question}
                position={index + 1}
                isFirst={index === 0}
                isLast={index === questions.length - 1}
                onOpen={handleOpenQuestion}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onRemove={setPendingRemoval}
                isMutating={isMutating}
              />
            ))}
          </div>
        )}

        <AssignQuestionsModal
          isOpen={isPickerOpen}
          onClose={() => {
            setIsPickerOpen(false);
          }}
          templatePublicId={template.publicId}
          onConfirm={handleAssign}
          isSubmitting={assign.isPending}
        />

        <UnassignQuestionModal
          isOpen={!!pendingRemoval}
          onClose={() => {
            setPendingRemoval(null);
          }}
          onConfirm={handleConfirmRemoval}
          isLoading={unassign.isPending}
          questionText={pendingRemoval?.questionText ?? ''}
        />
      </section>
    </ContentPanel>
  );
};
