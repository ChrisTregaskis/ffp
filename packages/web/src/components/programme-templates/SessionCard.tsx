import React, { useCallback, useMemo, useState } from 'react';

import type { TemplatePhaseWithSessions } from '@ffp/core';

import { Accordion } from '@web/components/accordion';
import { KebabMenu } from '@web/components/dropdown-menu';
import type { DropdownMenuItem } from '@web/components/dropdown-menu';
import { Text } from '@web/components/text';

import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ExerciseList } from './ExerciseList';
import { SessionForm } from './SessionForm';

import type { SessionFormValues } from './SessionForm';

/** Session shape from the nested template detail response */
export type SessionData = TemplatePhaseWithSessions['sessions'][number];

export interface SessionCardProps {
  /** Session data from the template detail response */
  session: SessionData;
  /** Template ID for exercise cache invalidation */
  templateId: string;
  /** Whether this is the first session in the phase (disables move up) */
  isFirst: boolean;
  /** Whether this is the last session in the phase (disables move down) */
  isLast: boolean;
  /** Called when session is updated */
  onUpdate: (
    sessionId: string,
    data: {
      name?: string | null;
      description?: string | null;
      estimatedDurationMinutes?: number | null;
    }
  ) => void;
  /** Called when session is deleted */
  onDelete: (sessionId: string) => void;
  /** Called when session should move up */
  onMoveUp: (sessionId: string) => void;
  /** Called when session should move down */
  onMoveDown: (sessionId: string) => void;
  /** Whether a mutation is in progress */
  isMutating?: boolean;
}

/** Collapsible card for a session within a phase */
export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  templateId,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isMutating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const displayName = session.name ?? `Session ${String(session.sessionNumber)}`;
  const exerciseCount = session.exercises.length;

  const handleToggle = useCallback(() => {
    if (!isEditing) {
      setIsExpanded((prev) => !prev);
    }
  }, [isEditing]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setIsExpanded(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSubmitEdit = useCallback(
    (values: SessionFormValues) => {
      onUpdate(session.id, {
        name: values.name || null,
        description: values.description || null,
        estimatedDurationMinutes: values.estimatedDurationMinutes
          ? parseInt(values.estimatedDurationMinutes, 10)
          : null,
      });
      setIsEditing(false);
    },
    [session.id, onUpdate]
  );

  const handleConfirmDelete = useCallback(() => {
    onDelete(session.id);
    setShowDeleteConfirm(false);
  }, [session.id, onDelete]);

  const trigger = (
    <>
      <Text styleProps={{ size: 'sm', weight: 'medium' }} className="truncate">
        {displayName}
      </Text>
      {session.estimatedDurationMinutes && (
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {session.estimatedDurationMinutes} min
        </Text>
      )}
      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
        {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
      </Text>
    </>
  );

  const menuItems: DropdownMenuItem[] = useMemo(
    () => [
      { label: 'Edit', onClick: handleEdit },
      {
        label: 'Move up',
        onClick: () => {
          onMoveUp(session.id);
        },
        disabled: isFirst,
      },
      {
        label: 'Move down',
        onClick: () => {
          onMoveDown(session.id);
        },
        disabled: isLast,
      },
      {
        label: 'Delete',
        onClick: () => {
          setShowDeleteConfirm(true);
        },
        variant: 'danger',
      },
    ],
    [handleEdit, onMoveUp, onMoveDown, session.id, isFirst, isLast]
  );

  const actions = <KebabMenu items={menuItems} disabled={isMutating} />;

  return (
    <>
      <Accordion
        trigger={trigger}
        actions={actions}
        expanded={isExpanded}
        onToggle={handleToggle}
        toggleDisabled={isEditing}
      >
        {isEditing ? (
          <SessionForm
            initialValues={{
              name: session.name ?? '',
              description: '', // Description not included in nested template detail response
              estimatedDurationMinutes: session.estimatedDurationMinutes
                ? String(session.estimatedDurationMinutes)
                : '',
            }}
            onSubmit={handleSubmitEdit}
            onCancel={handleCancelEdit}
            isSubmitting={isMutating}
          />
        ) : (
          <ExerciseList
            sessionId={session.id}
            templateId={templateId}
            exerciseCount={exerciseCount}
          />
        )}
      </Accordion>

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isMutating}
        title="Delete Session"
        message="This will permanently delete this session and all exercises within it. This action cannot be undone."
      />
    </>
  );
};
