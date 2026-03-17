import React, { useCallback, useState } from 'react';

import type { TemplatePhaseWithSessions } from '@ffp/core';

import { Accordion } from '@web/components/accordion';
import { IconButton } from '@web/components/button/IconButton';
import { Icons } from '@web/components/Icon/types';
import { Text } from '@web/components/text';

import { DeleteConfirmModal } from './DeleteConfirmModal';
import { SessionForm } from './SessionForm';

import type { SessionFormValues } from './SessionForm';

/** Session shape from the nested template detail response */
export type SessionData = TemplatePhaseWithSessions['sessions'][number];

export interface SessionCardProps {
  /** Session data from the template detail response */
  session: SessionData;
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

  const actions = (
    <>
      <IconButton
        icon={Icons.EDIT}
        size="sm"
        ariaLabel="Edit session"
        onClick={handleEdit}
        disabled={isMutating}
      />
      <IconButton
        icon={Icons.ARROWUP}
        size="sm"
        ariaLabel="Move session up"
        onClick={() => {
          onMoveUp(session.id);
        }}
        disabled={isFirst || isMutating}
      />
      <IconButton
        icon={Icons.ARROWDOWN}
        size="sm"
        ariaLabel="Move session down"
        onClick={() => {
          onMoveDown(session.id);
        }}
        disabled={isLast || isMutating}
      />
      <IconButton
        icon={Icons.TRASH2}
        size="sm"
        ariaLabel="Delete session"
        onClick={() => {
          setShowDeleteConfirm(true);
        }}
        disabled={isMutating}
      />
    </>
  );

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
              description: '',
              estimatedDurationMinutes: session.estimatedDurationMinutes
                ? String(session.estimatedDurationMinutes)
                : '',
            }}
            onSubmit={handleSubmitEdit}
            onCancel={handleCancelEdit}
            isSubmitting={isMutating}
          />
        ) : exerciseCount === 0 ? (
          <Text
            as="p"
            styleProps={{ size: 'sm', colour: 'muted-foreground' }}
            className="py-2 text-center"
          >
            No exercises yet
          </Text>
        ) : (
          <Text
            as="p"
            styleProps={{ size: 'sm', colour: 'muted-foreground' }}
            className="py-2 text-center"
          >
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'} — editing coming in
            FFP-486
          </Text>
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
