import { Text } from '@web/components/atoms';
import { parseExerciseNotes } from '@web/utils/exercise-instructions';

export interface ExerciseDetailProps {
  /** Exercise notes/instructions text */
  notes: string;
}

/**
 * Exercise instructions panel.
 */
export const ExerciseDetail: React.FC<ExerciseDetailProps> = ({ notes }) => (
  <div className="rounded-lg bg-muted/30 px-4 py-4">
    <Text as="h4" variant="eyebrow" className="mb-2">
      Instructions
    </Text>
    <Text as="p" styleProps={{ size: 'sm' }}>
      {parseExerciseNotes(notes)}
    </Text>
  </div>
);
