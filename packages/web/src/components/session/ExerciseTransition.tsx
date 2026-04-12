import { FadeSlide } from '@web/components/motion';

import type { ReactNode } from 'react';

export interface ExerciseTransitionProps {
  /** Unique key to trigger re-mount on exercise change */
  exerciseKey: string;
  /** Content to animate */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Animated transition wrapper for exercise swap.
 *
 * Thin wrapper over FadeSlide that applies a React key to trigger
 * re-mount and exit/enter animations when the active exercise changes.
 * Designed for use inside AnimatePresence on the SessionPage.
 */
export const ExerciseTransition: React.FC<ExerciseTransitionProps> = ({
  exerciseKey,
  children,
  className = '',
}) => (
  <FadeSlide key={exerciseKey} className={className}>
    {children}
  </FadeSlide>
);
