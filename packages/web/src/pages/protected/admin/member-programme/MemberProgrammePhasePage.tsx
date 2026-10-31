import React, { useCallback, useMemo } from 'react';
import { generatePath, useNavigate, useParams } from 'react-router-dom';

import type { CreateExerciseRequest, UpdateExerciseRequest } from '@ffp/core';

import { Button, ContentPanel, PageContainer } from '@web/components/atoms';
import {
  DescriptionPanel,
  EmptyState,
  ErrorRetryState,
  PageHeader,
  PageState,
} from '@web/components/molecules';
import { MemberSessionEditor } from '@web/components/programme';
import { RouteKey, routes } from '@web/config/routes';
import { useMemberProgrammeMutations, useUserProgrammeQuery } from '@web/hooks/users';
import { useToast } from '@web/hooks/useToast';
import { isProgrammeLoadFailure } from '@web/utils/programme';
import { swapAdjacentItem } from '@web/utils/reorder';

export const MemberProgrammePhasePage: React.FC = () => {
  const { id: publicId = '', phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();

  const { data: detail, isPending, error, refetch } = useUserProgrammeQuery(publicId);
  const mutations = useMemberProgrammeMutations(publicId);
  const { addToast } = useToast();

  const phase = detail?.phases.find((item) => item.publicId === phaseId);
  const sessions = useMemo(() => phase?.sessions ?? [], [phase]);
  const isMutating =
    mutations.addExercise.isPending ||
    mutations.updateExercise.isPending ||
    mutations.removeExercise.isPending ||
    mutations.reorderExercises.isPending ||
    mutations.reorderSessions.isPending;

  /** Toasts the outcome; a failure shows the server's reason and still rejects, for the caller */
  const report = useCallback(
    async (save: Promise<unknown>, success: string): Promise<void> => {
      try {
        await save;
        addToast(success, { variant: 'success' });
      } catch (saveError) {
        addToast(saveError instanceof Error ? saveError.message : "That change didn't save.", {
          variant: 'error',
        });
        throw saveError;
      }
    },
    [addToast]
  );

  const handleAddExercise = useCallback(
    (sessionId: string, data: CreateExerciseRequest) =>
      report(mutations.addExercise.mutateAsync({ sessionId, data }), 'Exercise added'),
    [report, mutations.addExercise]
  );

  const handleUpdateExercise = useCallback(
    (exerciseId: string, data: UpdateExerciseRequest) =>
      report(mutations.updateExercise.mutateAsync({ exerciseId, data }), 'Exercise updated'),
    [report, mutations.updateExercise]
  );

  const handleRemoveExercise = useCallback(
    (exerciseId: string) =>
      report(mutations.removeExercise.mutateAsync(exerciseId), 'Exercise removed'),
    [report, mutations.removeExercise]
  );

  const handleReorderExercises = useCallback(
    (sessionId: string, orderedIds: string[]) =>
      report(
        mutations.reorderExercises.mutateAsync({ parentId: sessionId, orderedIds }),
        'Exercise order updated'
      ),
    [report, mutations.reorderExercises]
  );

  const handleMoveSession = useCallback(
    async (sessionId: string, direction: 'up' | 'down'): Promise<void> => {
      const orderedIds = swapAdjacentItem(
        sessions.map((session) => session.userSession?.id ?? ''),
        sessionId,
        direction
      );

      if (!phase || !orderedIds) {
        return;
      }

      await report(
        mutations.reorderSessions.mutateAsync({ parentId: phase.id, orderedIds }),
        'Session order updated'
      );
    },
    [sessions, phase, report, mutations.reorderSessions]
  );

  // Only sessions not yet started move, and only past one another
  const isNotStarted = (index: number): boolean =>
    sessions[index]?.userSession?.status === 'not_started';
  const displayName = phase?.name ?? `Phase ${String(phase?.phaseNumber ?? '')}`;

  const handleBackToProgramme = useCallback(() => {
    void navigate(generatePath(routes[RouteKey.ADMIN_USER_PROGRAMME].path, { id: publicId }));
  }, [navigate, publicId]);

  const backButton = (
    <Button variant="secondary" size="sm" onClick={handleBackToProgramme}>
      Back to Programme
    </Button>
  );

  return (
    <PageContainer>
      <PageHeader
        title={phase ? `${displayName} — Sessions` : 'Programme Phase'}
        subtitle={detail?.programme.name}
      />

      {isPending ? (
        <PageState isLoading />
      ) : !detail && isProgrammeLoadFailure(error) ? (
        <ErrorRetryState
          title="We couldn't load this programme just now."
          onRetry={() => void refetch()}
        />
      ) : !phase ? (
        <EmptyState
          message={
            detail
              ? "This phase isn't part of the member's programme."
              : "This member doesn't have a programme yet."
          }
          action={backButton}
        />
      ) : (
        <ContentPanel>
          {phase.description && <DescriptionPanel description={phase.description} />}

          {phase.sessions.length === 0 ? (
            <EmptyState message="No sessions in this phase." />
          ) : (
            <div className="space-y-3">
              {phase.sessions.map((session, index) => (
                <MemberSessionEditor
                  key={session.userSession?.id ?? session.templateSessionId}
                  session={session}
                  canMoveUp={isNotStarted(index) && isNotStarted(index - 1)}
                  canMoveDown={isNotStarted(index) && isNotStarted(index + 1)}
                  isMutating={isMutating}
                  onAddExercise={handleAddExercise}
                  onUpdateExercise={handleUpdateExercise}
                  onRemoveExercise={handleRemoveExercise}
                  onReorderExercises={handleReorderExercises}
                  onMoveSession={handleMoveSession}
                />
              ))}
            </div>
          )}
        </ContentPanel>
      )}
    </PageContainer>
  );
};
