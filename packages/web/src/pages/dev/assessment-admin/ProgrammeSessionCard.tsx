import { useState } from 'react';

import { KebabMenu } from '@web/components/dropdown-menu';
import type { DropdownMenuItem } from '@web/components/dropdown-menu';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { AddExerciseControl } from './AddExerciseControl';
import { ProgrammeExerciseRow } from './ProgrammeExerciseRow';
import { iconVar } from './prototype-labels';
import { type Level } from './prototype-level-model';
import {
  availableVideosForSession,
  sessionMinutes,
  type MoveDirection,
  type ProgrammeSession,
} from './prototype-programme-structure';

interface ProgrammeSessionCardProps {
  session: ProgrammeSession;
  level: Level;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSwapExercise: (exerciseId: string) => void;
  onRemoveExercise: (exerciseId: string) => void;
  onMoveExercise: (exerciseId: string, direction: MoveDirection) => void;
  onAddExercise: (videoId: string) => void;
}

/** A session within a phase — expand to dig into its exercises, reorder, swap and add. */
export const ProgrammeSessionCard: React.FC<ProgrammeSessionCardProps> = ({
  session,
  level,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onSwapExercise,
  onRemoveExercise,
  onMoveExercise,
  onAddExercise,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sessionItems: DropdownMenuItem[] = [
    { label: 'Move up', onClick: onMoveUp, disabled: isFirst },
    { label: 'Move down', onClick: onMoveDown, disabled: isLast },
  ];

  const exerciseCount = session.exercises.length;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-2 p-3">
        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
          }}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Icon
            name={isOpen ? Icons.CHEVRONDOWN : Icons.CHEVRONRIGHT}
            styleProps={{ size: 'sm', colour: iconVar('muted-foreground') }}
          />
          <Text styleProps={{ size: 'sm', weight: 'semibold' }}>{session.name}</Text>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {sessionMinutes(session)} min · {exerciseCount}{' '}
            {exerciseCount === 1 ? 'exercise' : 'exercises'}
          </Text>
          <KebabMenu items={sessionItems} ariaLabel={`Actions for ${session.name}`} />
        </div>
      </div>

      {isOpen && (
        <div className="space-y-2 border-t border-border p-3">
          {session.exercises.map((exercise, index) => (
            <ProgrammeExerciseRow
              key={exercise.id}
              exercise={exercise}
              position={index + 1}
              isFirst={index === 0}
              isLast={index === exerciseCount - 1}
              onSwap={() => {
                onSwapExercise(exercise.id);
              }}
              onMoveUp={() => {
                onMoveExercise(exercise.id, 'up');
              }}
              onMoveDown={() => {
                onMoveExercise(exercise.id, 'down');
              }}
              onRemove={() => {
                onRemoveExercise(exercise.id);
              }}
            />
          ))}
          {exerciseCount === 0 && (
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
              No exercises in this session yet.
            </Text>
          )}

          <div className="flex justify-end pt-1">
            <AddExerciseControl
              options={availableVideosForSession(session, level)}
              onAdd={onAddExercise}
            />
          </div>
        </div>
      )}
    </div>
  );
};
