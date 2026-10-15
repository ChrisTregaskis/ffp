import { motion } from 'motion/react';

import type { ProgrammeDetailResponse } from '@ffp/core';

import type { StatusCircleStatus } from '@web/components/atoms';
import { StatusCircle } from '@web/components/atoms';

type Phase = ProgrammeDetailResponse['phases'][number];

export interface TimelineNodeProps extends Pick<Phase, 'status' | 'phaseNumber'> {
  /** Whether the node is visible (triggers scale animation) */
  isVisible: boolean;
}

const STATUS_MAP: Record<Phase['status'], StatusCircleStatus> = {
  completed: 'completed',
  in_progress: 'current',
  not_started: 'upcoming',
};

/** A phase's status circle on the timeline, scaling in when the phase comes into view. */
export const TimelineNode: React.FC<TimelineNodeProps> = ({ status, phaseNumber, isVisible }) => (
  <motion.div
    className="flex-shrink-0 transition-all duration-500"
    initial={{ scale: 0.6, opacity: 0 }}
    animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
  >
    <StatusCircle
      number={phaseNumber}
      status={STATUS_MAP[status]}
      size="lg"
      appearance="outlined"
    />
  </motion.div>
);
