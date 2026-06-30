import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { iconVar } from './prototype-labels';

const ADDITIONS = [
  'Goal tag axis (relieve / strength / energy) — today’s library has no goal dimension; the assembler needs it.',
  'Essential marker — flags core, must-have exercises for the persistent thread.',
  'Movement type becomes multi-valued — an exercise can be mobility and strength; and the model’s set includes Cardio, which today’s movement-type enum (stretch / strength / mobility / balance) does not. The taxonomy needs reconciling.',
  'Some free-form tags (e.g. “good for beginners”, “low impact”, “cardio”) would be promoted to typed categories so the assembler can reason about them.',
];

/** Explains how the existing video library would be iterated for the programme model. */
export const VideoLibraryIterationNote: React.FC = () => (
  <div className="mb-5 rounded-lg border border-info/30 bg-info/10 p-4">
    <div className="flex items-center gap-2">
      <Icon name={Icons.ZAP} styleProps={{ size: 'sm', colour: iconVar('info') }} />
      <Text styleProps={{ size: 'sm', weight: 'semibold', colour: 'info' }}>
        Starting from today’s Video Library — what the programme model adds
      </Text>
    </div>
    <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-1">
      This is the existing catalogue (same table, fields and actions). The columns marked “(new)”
      and the points below are the iteration needed to support the model — nothing else changes.
    </Text>
    <ul className="mt-2 space-y-1">
      {ADDITIONS.map((addition) => (
        <li key={addition} className="flex items-start gap-1.5">
          <Icon
            name={Icons.ARROWRIGHT}
            styleProps={{ size: 'xs', colour: iconVar('muted-foreground') }}
          />
          <Text styleProps={{ size: 'xs', colour: 'foreground' }}>{addition}</Text>
        </li>
      ))}
    </ul>
  </div>
);
