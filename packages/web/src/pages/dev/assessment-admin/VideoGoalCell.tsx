import { Text } from '@web/components/text';

import { type GoalId } from './prototype-programmes';
import { TagChip } from './TagChip';

const goalShort = (goal: GoalId): string => goal.charAt(0).toUpperCase() + goal.slice(1);

/** New column for the programme model — the goal tags an exercise serves. */
export const VideoGoalCell: React.FC<{ goals: GoalId[] }> = ({ goals }) =>
  goals.length === 0 ? (
    <Text styleProps={{ size: 'sm', colour: 'muted-foreground' }}>—</Text>
  ) : (
    <div className="flex flex-wrap gap-1">
      {goals.map((goal) => (
        <TagChip key={goal} label={goalShort(goal)} tone="info" />
      ))}
    </div>
  );
