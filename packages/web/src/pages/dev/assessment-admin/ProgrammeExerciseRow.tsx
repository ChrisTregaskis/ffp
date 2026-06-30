import { KebabMenu } from '@web/components/dropdown-menu';
import type { DropdownMenuItem } from '@web/components/dropdown-menu';
import { Text } from '@web/components/text';

import { type ProgrammeExercise } from './prototype-programme-structure';

interface ProgrammeExerciseRowProps {
  exercise: ProgrammeExercise;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  onSwap: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

/** One exercise in a session — its video and prescription, with a kebab actions menu. */
export const ProgrammeExerciseRow: React.FC<ProgrammeExerciseRowProps> = ({
  exercise,
  position,
  isFirst,
  isLast,
  onSwap,
  onMoveUp,
  onMoveDown,
  onRemove,
}) => {
  const prescription = `${String(exercise.sets)} ${exercise.sets === 1 ? 'set' : 'sets'} × ${exercise.reps} · Rest ${String(exercise.restSeconds)}s`;

  const items: DropdownMenuItem[] = [
    { label: 'Swap exercise', onClick: onSwap },
    { label: 'Move up', onClick: onMoveUp, disabled: isFirst },
    { label: 'Move down', onClick: onMoveDown, disabled: isLast },
    { label: 'Remove', onClick: onRemove, variant: 'danger' },
  ];

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-2.5">
      <div className="flex min-w-0 items-start gap-2.5">
        <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'muted-foreground' }}>
          {position}
        </Text>
        <div className="min-w-0">
          <Text styleProps={{ size: 'sm', weight: 'medium' }}>{exercise.video.title}</Text>
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            {prescription}
          </Text>
        </div>
      </div>
      <KebabMenu items={items} ariaLabel={`Actions for ${exercise.video.title}`} />
    </div>
  );
};
