import React, { useCallback, useMemo, useState } from 'react';

import type { TemplatePhaseWithSessions, UpdateSessionRequest } from '@ffp/core';

import { Text } from '@web/components/atoms';
import { Accordion, InlineFormPanel } from '@web/components/molecules';
import { KebabMenu, DeleteConfirmModal } from '@web/components/organisms';
import type { DropdownMenuItem } from '@web/components/organisms';
import { reorderableItemActions } from '@web/utils/reorderable-item-actions';

import { sessionToFormValues, toUpdateSessionRequest } from './session-form-values';
import { SessionCardContent } from './SessionCardContent';
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
  /** Saves the session; the form stays open, edits and all, if the promise rejects */
  onUpdate: (sessionId: string, data: UpdateSessionRequest) => Promise<void>;
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
      const payload = toUpdateSessionRequest(values, session);

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);

        return;
      }

      void onUpdate(session.id, payload).then(
        () => {
          setIsEditing(false);
        },
        // The page reports the failure; the form keeps the edits for another try
        () => undefined
      );
    },
    [session, onUpdate]
  );

  const handleConfirmDelete = useCallback(() => {
    onDelete(session.id);
    setShowDeleteConfirm(false);
  }, [session.id, onDelete]);

  // Wraps at phone width, as the member programme's session card does
  const trigger = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
      <Text styleProps={{ size: 'sm', weight: 'medium' }} className="max-w-full truncate">
        {displayName}
      </Text>
      {session.estimatedDurationMinutes ? (
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="whitespace-nowrap">
          {session.estimatedDurationMinutes} min
        </Text>
      ) : null}
      <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="whitespace-nowrap">
        {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
      </Text>
    </div>
  );

  const menuItems: DropdownMenuItem[] = useMemo(
    () =>
      reorderableItemActions({
        onEdit: handleEdit,
        onMoveUp: () => {
          onMoveUp(session.id);
        },
        onMoveDown: () => {
          onMoveDown(session.id);
        },
        onDelete: () => {
          setShowDeleteConfirm(true);
        },
        isFirst,
        isLast,
      }),
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
          <InlineFormPanel title="Edit Session">
            <SessionForm
              initialValues={sessionToFormValues(session)}
              onSubmit={handleSubmitEdit}
              onCancel={handleCancelEdit}
              isSubmitting={isMutating}
            />
          </InlineFormPanel>
        ) : (
          <SessionCardContent
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
        message="This will permanently delete this session with its slots and exercises. A session that members' programmes include can't be deleted. This action cannot be undone."
      />
    </>
  );
};
