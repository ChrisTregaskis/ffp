import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@web/components/button';
import { EmptyState } from '@web/components/feedback/EmptyState';
import { PageState } from '@web/components/feedback/PageState';
import { Icon } from '@web/components/Icon';
import { ContentPanel, PageContainer, PageHeader } from '@web/components/layout';
import { InlineFormPanel, SessionCard } from '@web/components/programme-templates';
import { SessionForm } from '@web/components/programme-templates/SessionForm';
import type { SessionFormValues } from '@web/components/programme-templates/SessionForm';
import { Text } from '@web/components/text';
import {
  useCreateSessionMutation,
  useDeleteSessionMutation,
  useReorderSessionsMutation,
  useTemplateDetailQuery,
  useUpdatePhaseMutation,
  useUpdateSessionMutation,
} from '@web/hooks/programme-templates';
import { useToast } from '@web/hooks/useToast';
import { RouteKey, routes } from '@web/pages/routes';
import { swapAdjacentItem } from '@web/utils/reorder';

export const PhaseDetailPage: React.FC = () => {
  const { id: templateId, phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: template, isLoading, error } = useTemplateDetailQuery(templateId ?? '');

  const updatePhase = useUpdatePhaseMutation(templateId ?? '');
  const createSession = useCreateSessionMutation(templateId ?? '');
  const updateSession = useUpdateSessionMutation(templateId ?? '');
  const deleteSession = useDeleteSessionMutation(templateId ?? '');
  const reorderSessions = useReorderSessionsMutation(templateId ?? '');

  const isMutating =
    updatePhase.isPending ||
    createSession.isPending ||
    updateSession.isPending ||
    deleteSession.isPending ||
    reorderSessions.isPending;

  const [isAddingSession, setIsAddingSession] = useState(false);

  const phase = useMemo(() => template?.phases.find((p) => p.id === phaseId), [template, phaseId]);

  const displayName = phase?.name ?? `Phase ${String(phase?.phaseNumber ?? '')}`;
  const sessions = useMemo(() => phase?.sessions ?? [], [phase?.sessions]);

  const handleNavigateBack = useCallback(() => {
    if (!templateId) {
      return;
    }

    void navigate(`${routes[RouteKey.ADMIN_TEMPLATES].path}/${templateId}/phases`);
  }, [navigate, templateId]);

  const handleNavigateToTemplates = useCallback(() => {
    void navigate(routes[RouteKey.ADMIN_TEMPLATES].path);
  }, [navigate]);

  // --- Session handlers ---

  const handleCreateSession = useCallback(
    (values: SessionFormValues) => {
      if (!phaseId) {
        return;
      }

      createSession.mutate(
        {
          phaseId,
          data: {
            name: values.name || null,
            description: values.description || null,
            estimatedDurationMinutes: values.estimatedDurationMinutes
              ? parseInt(values.estimatedDurationMinutes, 10)
              : null,
          },
        },
        {
          onSuccess: () => {
            addToast('Session created', { variant: 'success' });
            setIsAddingSession(false);
          },
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [phaseId, createSession, addToast]
  );

  const handleUpdateSession = useCallback(
    (
      sessionId: string,
      data: {
        name?: string | null;
        description?: string | null;
        estimatedDurationMinutes?: number | null;
      }
    ) => {
      updateSession.mutate(
        { sessionId, data },
        {
          onSuccess: () => addToast('Session updated', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [updateSession, addToast]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      deleteSession.mutate(
        { sessionId },
        {
          onSuccess: () => addToast('Session deleted', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [deleteSession, addToast]
  );

  const handleSessionReorder = useCallback(
    (sessionId: string, direction: 'up' | 'down') => {
      if (!phaseId) {
        return;
      }

      const reordered = swapAdjacentItem(
        sessions.map((s) => s.id),
        sessionId,
        direction
      );

      if (!reordered) {
        return;
      }

      reorderSessions.mutate(
        { phaseId, orderedIds: reordered },
        {
          onSuccess: () => addToast('Session order updated', { variant: 'success' }),
          onError: (err) => addToast(err.message, { variant: 'error' }),
        }
      );
    },
    [phaseId, sessions, reorderSessions, addToast]
  );

  return (
    <PageContainer>
      <PageHeader
        title={template ? `${displayName} — Sessions` : 'Phase Detail'}
        actions={
          <Button
            variant="primary"
            icon={<Icon name="Plus" styleProps={{ size: 'sm', colour: 'currentColor' }} />}
            onClick={() => {
              setIsAddingSession(true);
            }}
            disabled={isMutating}
          >
            Add Session
          </Button>
        }
      />

      {(isLoading || error) && (
        <PageState
          isLoading={isLoading}
          title="Unable to load phase"
          message={error?.message}
          actionLabel="Back to Programme Templates"
          onAction={handleNavigateToTemplates}
        />
      )}

      {template && !phase && (
        <PageState
          title="Phase not found"
          message="The requested phase does not exist in this template."
          actionLabel="Back to Phases"
          onAction={handleNavigateBack}
        />
      )}

      {phase && (
        <ContentPanel>
          {/* Phase summary */}
          {phase.description && (
            <div className="mb-4 rounded-lg border border-border bg-white px-5 py-4">
              <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
                {phase.description}
              </Text>
            </div>
          )}

          {/* Add session form */}
          {isAddingSession && (
            <InlineFormPanel title="New Session">
              <SessionForm
                onSubmit={handleCreateSession}
                onCancel={() => {
                  setIsAddingSession(false);
                }}
                isSubmitting={createSession.isPending}
                submitLabel="Add Session"
              />
            </InlineFormPanel>
          )}

          {/* Session cards */}
          {sessions.length === 0 && !isAddingSession ? (
            <EmptyState
              message="No sessions yet. Add the first session to this phase."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAddingSession(true);
                  }}
                >
                  + Add Session
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  templateId={templateId ?? ''}
                  isFirst={index === 0}
                  isLast={index === sessions.length - 1}
                  onUpdate={handleUpdateSession}
                  onDelete={handleDeleteSession}
                  onMoveUp={(id) => {
                    handleSessionReorder(id, 'up');
                  }}
                  onMoveDown={(id) => {
                    handleSessionReorder(id, 'down');
                  }}
                  isMutating={isMutating}
                />
              ))}
            </div>
          )}
        </ContentPanel>
      )}
    </PageContainer>
  );
};
