import { Text } from '@web/components/text';

import { LEVEL_SLOTS } from './prototype-assembly';
import { LEVEL_META, type Level } from './prototype-level-model';
import { MOVEMENT_LABELS } from './prototype-programmes';
import { TagChip } from './TagChip';

interface LevelShellCardProps {
  level: Level;
  active: boolean;
}

/** One of Option B's three authored level "shells" — its slots set the session balance. */
export const LevelShellCard: React.FC<LevelShellCardProps> = ({ level, active }) => {
  const slots = LEVEL_SLOTS[level];
  const essentialCount = slots.filter((slot) => slot.essential).length;

  return (
    <div
      className={`rounded-lg border p-3 ${
        active ? 'border-primary bg-primary/5' : 'border-border bg-card'
      }`}
    >
      <Text
        styleProps={{ size: 'sm', weight: 'semibold', colour: active ? 'primary' : 'foreground' }}
      >
        {LEVEL_META[level].name}
      </Text>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-0.5">
        {slots.length} slots · {essentialCount} essential — exercises pull in by tag.
      </Text>
      <div className="mt-2 flex flex-wrap gap-1">
        {slots.map((slot) => (
          <TagChip
            key={slot.id}
            label={MOVEMENT_LABELS[slot.movement]}
            tone={slot.essential ? 'warning' : 'muted'}
          />
        ))}
      </div>
    </div>
  );
};
