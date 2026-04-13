import { motion } from 'motion/react';

import type { ProgrammeDetailResponse } from '@ffp/core';

import { Icon, Icons } from '@web/components/Icon';
import { Text } from '@web/components/text/Text';

type Phase = ProgrammeDetailResponse['phases'][number];

export interface TimelineNodeProps extends Pick<Phase, 'status' | 'phaseNumber'> {
  /** Whether the node is visible (triggers scale animation) */
  isVisible: boolean;
}

const BASE_CLASSES =
  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all duration-500';

/**
 * Timeline node circle indicating phase status.
 *
 * - Completed: green with white checkmark
 * - In progress: dark-blue solid with phase number in white
 * - Not started: bordered/muted with phase number
 */
export const TimelineNode: React.FC<TimelineNodeProps> = ({ status, phaseNumber, isVisible }) => {
  const animationProps = {
    initial: { scale: 0.6, opacity: 0 } as const,
    animate: isVisible ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 },
    transition: { duration: 0.4, ease: 'easeOut' as const },
  };

  if (status === 'completed') {
    return (
      <motion.div className={`${BASE_CLASSES} bg-ffp-green`} {...animationProps}>
        <Icon name={Icons.CHECK} styleProps={{ size: 'sm', colour: '#ffffff' }} />
      </motion.div>
    );
  }

  if (status === 'in_progress') {
    return (
      <motion.div className={`${BASE_CLASSES} bg-ffp-dark-blue`} {...animationProps}>
        <Text styleProps={{ size: 'sm', weight: 'bold', colour: 'white' }}>
          {String(phaseNumber)}
        </Text>
      </motion.div>
    );
  }

  return (
    <motion.div className={`${BASE_CLASSES} border-2 border-border bg-white`} {...animationProps}>
      <Text styleProps={{ size: 'sm', weight: 'medium', colour: 'muted-foreground' }}>
        {String(phaseNumber)}
      </Text>
    </motion.div>
  );
};
