import React, { useMemo } from 'react';

import type { ExerciseResponse } from '@ffp/core';

import { KebabMenu } from '@web/components/dropdown-menu';
import type { DropdownMenuItem } from '@web/components/dropdown-menu';
import { Text } from '@web/components/text';

export interface ExerciseRowProps {
  /** Exercise data with embedded video summary */
  exercise: ExerciseResponse;
  /** Whether this is the first exercise in the session */
  isFirst: boolean;
  /** Whether this is the last exercise in the session */
  isLast: boolean;
  /** Called when edit is clicked */
  onEdit: (exerciseId: string) => void;
  /** Called when delete is clicked */
  onDelete: (exerciseId: string) => void;
  /** Called when move up is clicked */
  onMoveUp: (exerciseId: string) => void;
  /** Called when move down is clicked */
  onMoveDown: (exerciseId: string) => void;
  /** Whether a mutation is in progress */
  isMutating?: boolean;
}

/** Formats prescription summary (e.g. "3 sets x 8-12 reps") */
const formatPrescription = (sets: number, reps: string): string => {
  return `${String(sets)} ${sets === 1 ? 'set' : 'sets'} x ${reps}`;
};

/** Formats seconds as a readable duration string */
const formatSeconds = (seconds: number): string => {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return secs > 0 ? `${String(mins)}m ${String(secs)}s` : `${String(mins)}m`;
  }

  return `${String(seconds)}s`;
};

/** Row displaying an exercise within a session — video title, prescription, and actions. */
export const ExerciseRow: React.FC<ExerciseRowProps> = ({
  exercise,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isMutating = false,
}) => {
  const menuItems: DropdownMenuItem[] = useMemo(
    () => [
      {
        label: 'Edit',
        onClick: () => {
          onEdit(exercise.id);
        },
      },
      {
        label: 'Move up',
        onClick: () => {
          onMoveUp(exercise.id);
        },
        disabled: isFirst,
      },
      {
        label: 'Move down',
        onClick: () => {
          onMoveDown(exercise.id);
        },
        disabled: isLast,
      },
      {
        label: 'Delete',
        onClick: () => {
          onDelete(exercise.id);
        },
        variant: 'danger',
      },
    ],
    [exercise.id, onEdit, onMoveUp, onMoveDown, onDelete, isFirst, isLast]
  );

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-white px-3 py-2">
      {/* Order indicator */}
      <Text
        styleProps={{ size: 'xs', colour: 'muted-foreground', weight: 'medium' }}
        className="w-5 shrink-0 text-center"
      >
        {String(exercise.orderIndex + 1)}
      </Text>

      {/* Video title + prescription */}
      <div className="min-w-0 flex-1">
        <Text styleProps={{ size: 'sm', weight: 'medium' }} className="truncate">
          {exercise.video.title}
        </Text>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {formatPrescription(exercise.sets, exercise.reps)}
          </Text>
          {exercise.durationSeconds && (
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              {formatSeconds(exercise.durationSeconds)}
            </Text>
          )}
          {exercise.restSeconds != null && exercise.restSeconds > 0 && (
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              Rest: {formatSeconds(exercise.restSeconds)}
            </Text>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center">
        <KebabMenu items={menuItems} disabled={isMutating} />
      </div>
    </div>
  );
};
