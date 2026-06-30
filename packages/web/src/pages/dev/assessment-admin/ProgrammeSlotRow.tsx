import { Button, IconButton } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Select } from '@web/components/select';
import { Text } from '@web/components/text';

import { ExerciseTags } from './ExerciseTags';
import { type AssembledSlot } from './prototype-assembly';
import { iconVar } from './prototype-labels';
import { MOVEMENT_LABELS, type Exercise } from './prototype-programmes';
import { TagChip } from './TagChip';

interface ProgrammeSlotRowProps {
  item: AssembledSlot;
  /** Exercises this slot could hold by hand — used to add into an empty slot. */
  options: Exercise[];
  onSwap: () => void;
  onRemove: () => void;
  onAdd: (exerciseId: string) => void;
}

/** One assembled slot — its category and tier, the drawn exercise, and hand-edit controls. */
export const ProgrammeSlotRow: React.FC<ProgrammeSlotRowProps> = ({
  item,
  options,
  onSwap,
  onRemove,
  onAdd,
}) => {
  const { slot, exercise } = item;

  return (
    <div className="rounded-md border border-border bg-background p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <TagChip label={MOVEMENT_LABELS[slot.movement]} tone="primary" />
          {slot.essential ? (
            <span className="flex items-center gap-1">
              <Icon name={Icons.SHIELD} styleProps={{ size: 'xs', colour: iconVar('warning') }} />
              <TagChip label="Essential" tone="warning" />
            </span>
          ) : (
            <TagChip label="Nice-to-have" tone="muted" />
          )}
        </div>
        {exercise ? (
          <div className="flex shrink-0 items-center gap-1">
            <Icon
              name={Icons.CLOCK}
              styleProps={{ size: 'xs', colour: iconVar('muted-foreground') }}
            />
            <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>{exercise.minutes}m</Text>
          </div>
        ) : null}
      </div>

      {exercise ? (
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Text styleProps={{ size: 'sm', weight: 'medium' }}>{exercise.name}</Text>
            <ExerciseTags exercise={exercise} />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={<Icon name={Icons.REPEAT} styleProps={{ size: 'xs' }} />}
              onClick={onSwap}
            >
              Swap
            </Button>
            <IconButton
              icon={Icons.TRASH2}
              size="sm"
              colour={iconVar('destructive')}
              ariaLabel={`Remove ${exercise.name}`}
              onClick={onRemove}
            />
          </div>
        </div>
      ) : (
        <div className="mt-2 space-y-1.5">
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
            Empty slot — add an exercise from the {MOVEMENT_LABELS[slot.movement].toLowerCase()}{' '}
            pool.
          </Text>
          <Select
            value=""
            placeholder="Add an exercise…"
            ariaLabel={`Add a ${MOVEMENT_LABELS[slot.movement]} exercise`}
            options={options.map((option) => ({ value: option.id, label: option.name }))}
            onChange={(value) => {
              onAdd(String(value));
            }}
          />
        </div>
      )}
    </div>
  );
};
