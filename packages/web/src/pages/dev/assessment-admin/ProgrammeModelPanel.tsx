import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text';

import { AssembledProgramme } from './AssembledProgramme';
import { LevelShellCard } from './LevelShellCard';
import { iconVar } from './prototype-labels';
import { LEVEL_META } from './prototype-level-model';
import { EXERCISE_LIBRARY, LEVELS, type Scenario } from './prototype-programmes';

interface ProgrammeModelPanelProps {
  scenario: Scenario;
}

/** The confirmed model — three level shells; tagged exercises assemble each member's set by slot. */
export const ProgrammeModelPanel: React.FC<ProgrammeModelPanelProps> = ({ scenario }) => (
  <div className="space-y-4">
    {/* Headline */}
    <div className="rounded-lg border border-border bg-card p-4">
      <Text styleProps={{ size: '2xl', weight: 'bold' }}>3 programmes</Text>
      <Text as="p" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
        one shell per level, plus a single library of {EXERCISE_LIBRARY.length} tagged exercises.
      </Text>
      <div className="mt-2 flex items-start gap-1.5">
        <Icon name={Icons.CHECKCIRCLE} styleProps={{ size: 'sm', colour: iconVar('success') }} />
        <Text styleProps={{ size: 'xs', colour: 'success' }}>
          A new goal or focus area means tagging exercises, not authoring more programmes.
        </Text>
      </div>
    </div>

    {/* The three shells */}
    <div>
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>The three authored shells</Text>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-0.5">
        Each shell defines a few slots by category, so any draw is a balanced session.
      </Text>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {LEVELS.map((level) => (
          <LevelShellCard key={level} level={level} active={level === scenario.level} />
        ))}
      </div>
    </div>

    {/* The interactive assembly for the active result */}
    <div>
      <Text styleProps={{ size: 'sm', weight: 'semibold' }}>
        Assembling from the {LEVEL_META[scenario.level].name} shell
      </Text>
      <Text as="p" styleProps={{ size: 'xs', colour: 'muted-foreground' }} className="mt-0.5">
        Regenerate to rotate the nice-to-have slots, lean the mix by profile, or hand-edit any row.
      </Text>
      <div className="mt-2">
        <AssembledProgramme scenario={scenario} />
      </div>
    </div>
  </div>
);
