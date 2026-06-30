import { useEffect, useState } from 'react';

import { Button } from '@web/components/button';
import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { ProgrammeSlotRow } from './ProgrammeSlotRow';
import {
  assembledExercises,
  assembleProgramme,
  availableForSlot,
  clearSlotExercise,
  EMPHASIS_OPTIONS,
  regenerateOptional,
  setSlotExercise,
  swapSlotExercise,
  type AssembledSlot,
  type EmphasisId,
} from './prototype-assembly';
import { iconVar } from './prototype-labels';
import { type Scenario } from './prototype-programmes';

interface AssembledProgrammeProps {
  scenario: Scenario;
}

/**
 * The interactive Option B experience — one member's assembled set, drawn slot by
 * slot. Regenerate rotates the nice-to-have slots while the essential thread holds;
 * each row can be hand-edited (swap, remove, add) without touching the shell or tags.
 */
export const AssembledProgramme: React.FC<AssembledProgrammeProps> = ({ scenario }) => {
  const [emphasis, setEmphasis] = useState<EmphasisId>('balanced');
  const [assembled, setAssembled] = useState<AssembledSlot[]>([]);

  useEffect(() => {
    setAssembled(
      assembleProgramme({
        level: scenario.level,
        goalId: scenario.goalId,
        focusIds: scenario.focusIds,
        emphasis,
      })
    );
  }, [scenario.level, scenario.goalId, scenario.focusIds, emphasis]);

  const exercises = assembledExercises(assembled);
  const totalMinutes = exercises.reduce((sum, exercise) => sum + exercise.minutes, 0);
  const selectedHint = EMPHASIS_OPTIONS.find((option) => option.id === emphasis)?.hint ?? '';

  const handleRegenerate = (): void => {
    setAssembled((previous) => regenerateOptional(previous, scenario.level));
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Text styleProps={{ size: 'sm', weight: 'semibold' }}>This member’s assembled set</Text>
          <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-0.5">
            {exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'} · about{' '}
            {totalMinutes} minutes — drawn one per slot, no exercise repeated.
          </Text>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<Icon name={Icons.RELOAD} styleProps={{ size: 'xs' }} />}
          onClick={handleRegenerate}
        >
          Regenerate
        </Button>
      </div>

      {/* Emphasis — the assessment profile nudges the optional slots, not just the goal. */}
      <div className="mt-3 space-y-1.5">
        <Text styleProps={{ size: 'xs', weight: 'medium', colour: 'muted-foreground' }}>
          Profile lean
        </Text>
        <div className="flex flex-wrap items-center gap-1.5">
          {EMPHASIS_OPTIONS.map((option) => (
            <Button
              key={option.id}
              variant={emphasis === option.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => {
                setEmphasis(option.id);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          {selectedHint}.
        </Text>
      </div>

      {/* The essential thread cue */}
      <div className="mt-3 flex items-start gap-1.5 rounded-md border border-warning/20 bg-warning/5 p-2">
        <Icon name={Icons.SHIELD} styleProps={{ size: 'sm', colour: iconVar('warning') }} />
        <Text styleProps={{ size: 'xs', colour: 'muted-foreground' }}>
          Essential slots are the persistent thread — they hold steady when you regenerate, while
          the nice-to-have slots refresh.
        </Text>
      </div>

      <div className="mt-3 space-y-2">
        {assembled.map((item) => (
          <ProgrammeSlotRow
            key={item.slot.id}
            item={item}
            options={availableForSlot(assembled, item.slot.id, scenario.level)}
            onSwap={() => {
              setAssembled((previous) => swapSlotExercise(previous, item.slot.id, scenario.level));
            }}
            onRemove={() => {
              setAssembled((previous) => clearSlotExercise(previous, item.slot.id));
            }}
            onAdd={(exerciseId) => {
              setAssembled((previous) => setSlotExercise(previous, item.slot.id, exerciseId));
            }}
          />
        ))}
      </div>

      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-3">
        Hand-edits stay with this member — the level shell and exercise tags are untouched.
      </Text>
    </div>
  );
};
