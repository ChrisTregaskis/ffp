import React, { useCallback, useMemo, useState } from 'react';

import type { CreateExerciseRequest, UpdateExerciseRequest } from '@ffp/core';
import { LOCKED_SESSION_REASONS } from '@ffp/core';

import { Text } from '@web/components/atoms';
import { StaticAlert } from '@web/components/molecules';
import { ConfirmModal, KebabMenu } from '@web/components/organisms';
import {
  toCreateExerciseRequest,
  toUpdateExerciseRequest,
} from '@web/components/programme-templates';
import type { ExerciseFormValues } from '@web/components/programme-templates';
import { swapAdjacentItem } from '@web/utils/reorder';

import { toStoredExercise } from './member-exercise-values';
import { memberExerciseActions, memberSessionActions } from './member-programme-actions';
import { MemberExerciseFormPanel } from './MemberExerciseFormPanel';
import { ProgrammeSessionCard } from './ProgrammeSessionCard';

import type { MemberExerciseFormMode } from './MemberExerciseFormPanel';
import type { ProgrammeExercise } from './ProgrammeExerciseRow';
import type { ProgrammeSession } from './ProgrammeSessionCard';

/** A session usually holds at least this many; fewer is allowed, with a warning */
const SUGGESTED_MINIMUM_EXERCISES = 3;

export interface MemberSessionEditorProps {
  session: ProgrammeSession;
  /** The neighbouring session has not started either, so the two can swap */
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** An edit is in flight somewhere on the page */
  isMutating: boolean;
  /** Each handler reports its own outcome; a rejection keeps the form open with its edits */
  onAddExercise: (sessionId: string, data: CreateExerciseRequest) => Promise<void>;
  onUpdateExercise: (exerciseId: string, data: UpdateExerciseRequest) => Promise<void>;
  onRemoveExercise: (exerciseId: string) => Promise<void>;
  onReorderExercises: (sessionId: string, orderedIds: string[]) => Promise<void>;
  onMoveSession: (sessionId: string, direction: 'up' | 'down') => Promise<void>;
}

/**
 * One session of a member's programme, editable while the member has not started it: add, swap,
 * edit, move and remove its exercises, and move the session among the others not yet started.
 */
export const MemberSessionEditor: React.FC<MemberSessionEditorProps> = ({
  session,
  canMoveUp,
  canMoveDown,
  isMutating,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onReorderExercises,
  onMoveSession,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openForm, setOpenForm] = useState<MemberExerciseFormMode | null>(null);
  const [removeTarget, setRemoveTarget] = useState<ProgrammeExercise | null>(null);

  const sessionId = session.userSession?.id ?? '';
  const displayName = session.name ?? `Session ${String(session.sessionNumber)}`;
  const status = session.userSession?.status;
  const isEditable = status === 'not_started';
  const exercises = useMemo(() => session.exercises ?? [], [session.exercises]);
  const exerciseIds = useMemo(
    () => exercises.map((exercise) => exercise.sessionExerciseId),
    [exercises]
  );
  const videoIds = useMemo(() => exercises.map((exercise) => exercise.video.id), [exercises]);
  const menusDisabled = isMutating || openForm !== null;

  const closeForm = useCallback(() => {
    setOpenForm(null);
  }, []);

  const open = useCallback((form: MemberExerciseFormMode) => {
    setOpenForm(form);
    setIsExpanded(true);
  }, []);

  const handleMoveExercise = useCallback(
    (exerciseId: string, direction: 'up' | 'down') => {
      const orderedIds = swapAdjacentItem(exerciseIds, exerciseId, direction);

      if (orderedIds) {
        void onReorderExercises(sessionId, orderedIds).catch(() => undefined);
      }
    },
    [exerciseIds, onReorderExercises, sessionId]
  );

  const handleSubmit = useCallback(
    (values: ExerciseFormValues) => {
      if (!openForm) {
        return;
      }

      let save: Promise<void>;

      if (openForm.mode === 'add') {
        save = onAddExercise(sessionId, toCreateExerciseRequest(values));
      } else {
        const payload = toUpdateExerciseRequest(values, toStoredExercise(openForm.exercise));

        if (Object.keys(payload).length === 0) {
          closeForm();

          return;
        }

        save = onUpdateExercise(openForm.exercise.sessionExerciseId, payload);
      }

      // The page reports a failure; the form keeps the edits for another try
      void save.then(closeForm, () => undefined);
    },
    [openForm, onAddExercise, onUpdateExercise, sessionId, closeForm]
  );

  const handleConfirmRemove = useCallback(() => {
    if (!removeTarget) {
      return;
    }

    const closeModal = (): void => {
      setRemoveTarget(null);
    };

    void onRemoveExercise(removeTarget.sessionExerciseId).then(closeModal, closeModal);
  }, [removeTarget, onRemoveExercise]);

  const sessionMenu = isEditable ? (
    <KebabMenu
      items={memberSessionActions({
        onAddExercise: () => {
          open({ mode: 'add' });
        },
        onMoveUp: () => {
          void onMoveSession(sessionId, 'up').catch(() => undefined);
        },
        onMoveDown: () => {
          void onMoveSession(sessionId, 'down').catch(() => undefined);
        },
        canMoveUp,
        canMoveDown,
      })}
      disabled={menusDisabled}
      ariaLabel={`Actions for ${displayName}`}
    />
  ) : undefined;

  // The row's position, not its orderIndex, is what a reorder sends
  const renderExerciseActions = (exercise: ProgrammeExercise): React.ReactNode => {
    const position = exerciseIds.indexOf(exercise.sessionExerciseId);

    return (
      <KebabMenu
        items={memberExerciseActions({
          onSwap: () => {
            open({ mode: 'swap', exercise });
          },
          onEdit: () => {
            open({ mode: 'edit', exercise });
          },
          onMoveUp: () => {
            handleMoveExercise(exercise.sessionExerciseId, 'up');
          },
          onMoveDown: () => {
            handleMoveExercise(exercise.sessionExerciseId, 'down');
          },
          onRemove: () => {
            setRemoveTarget(exercise);
          },
          isFirst: position === 0,
          isLast: position === exerciseIds.length - 1,
        })}
        disabled={menusDisabled}
        ariaLabel={`Actions for ${exercise.video.title}`}
      />
    );
  };

  const showWarning = isEditable && exercises.length < SUGGESTED_MINIMUM_EXERCISES;
  const lockedNote = !isEditable && status ? LOCKED_SESSION_REASONS[status] : null;

  const footer =
    lockedNote !== null || showWarning || openForm !== null ? (
      <>
        {lockedNote && (
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {lockedNote}
          </Text>
        )}
        {showWarning && (
          <StaticAlert
            variant="warning"
            message={`Sessions usually hold at least ${String(SUGGESTED_MINIMUM_EXERCISES)} exercises; this one has ${String(exercises.length)}.`}
          />
        )}
        {openForm && (
          <MemberExerciseFormPanel
            form={openForm}
            videoIds={videoIds}
            isSubmitting={isMutating}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        )}
      </>
    ) : undefined;

  return (
    <>
      <ProgrammeSessionCard
        session={session}
        actions={sessionMenu}
        renderExerciseActions={isEditable ? renderExerciseActions : undefined}
        footer={footer}
        expanded={isExpanded}
        onToggle={() => {
          setIsExpanded((previous) => !previous);
        }}
        toggleDisabled={openForm !== null}
      />

      <ConfirmModal
        isOpen={removeTarget !== null}
        onClose={() => {
          setRemoveTarget(null);
        }}
        onConfirm={handleConfirmRemove}
        isLoading={isMutating}
        title="Remove exercise"
        message={`Remove ${removeTarget?.video.title ?? 'this exercise'} from this member's session? Their other sessions and other members' programmes stay as they are.`}
        confirmLabel="Remove"
        hideDividers
      />
    </>
  );
};
