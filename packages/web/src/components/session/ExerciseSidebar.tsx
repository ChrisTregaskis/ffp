import { CollapsibleSidebar } from '@web/components/motion';
import { Text } from '@web/components/text/Text';

import { ExerciseSidebarItem } from './ExerciseSidebarItem';

import type { SessionExercise } from './types';

export interface ExerciseSidebarProps {
  /** All exercises in the session */
  exercises: SessionExercise[];
  /** Index of the currently active exercise */
  activeIndex: number;
  /** Whether the sidebar is open (desktop) */
  isOpen: boolean;
  /** Called when an exercise is clicked */
  onExerciseClick: (index: number) => void;
}

/**
 * Collapsible exercise sidebar listing all session exercises.
 *
 * Desktop only (lg:) — mobile uses a bottom drawer instead.
 * Animates width on open/close via CollapsibleSidebar.
 */
export const ExerciseSidebar: React.FC<ExerciseSidebarProps> = ({
  exercises,
  activeIndex,
  isOpen,
  onExerciseClick,
}) => (
  <CollapsibleSidebar isOpen={isOpen} className="bg-muted/30">
    <div className="py-4">
      <Text
        as="h3"
        styleProps={{ size: 'xs', weight: 'semibold', colour: 'muted-foreground' }}
        className="mb-2 px-3 uppercase tracking-wide"
      >
        Exercises
      </Text>
      {exercises.map((exercise, idx) => (
        <ExerciseSidebarItem
          key={exercise.completionId}
          title={exercise.title}
          index={idx + 1}
          isCurrent={idx === activeIndex}
          isCompleted={exercise.completed}
          onClick={() => {
            onExerciseClick(idx);
          }}
        />
      ))}
    </div>
  </CollapsibleSidebar>
);
