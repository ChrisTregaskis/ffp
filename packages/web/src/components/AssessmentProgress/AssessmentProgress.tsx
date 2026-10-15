import { useMemo } from 'react';

import type { FlowStepType } from '@ffp/core';

import { ProgressBar, Text } from '@web/components/atoms';

import { getPhaseLabel } from './utils';

export interface AssessmentProgressProps {
  /** Current step number (1-based) */
  currentStep: number;
  /** Total number of steps in the assessment flow */
  totalSteps: number;
  /** Current phase/type of the assessment step */
  phase: FlowStepType;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Assessment progress bar component.
 *
 * Displays visual progress through an assessment with:
 */
export const AssessmentProgress: React.FC<AssessmentProgressProps> = ({
  currentStep,
  totalSteps,
  phase,
  className = '',
}) => {
  // Calculate progress percentage
  const percentage = useMemo(() => {
    return totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;
  }, [currentStep, totalSteps]);

  // Simple constant lookup - no memoisation needed
  const phaseLabel = getPhaseLabel(phase);

  return (
    <div className={`w-full ${className}`.trim()}>
      {/* Phase label and step counter row */}
      <div className="mb-2 flex items-center justify-between">
        <Text as="span" styleProps={{ size: 'sm', weight: 'medium', colour: 'foreground' }}>
          {phaseLabel}
        </Text>
        <Text as="span" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          {currentStep}/{totalSteps}
        </Text>
      </div>

      <ProgressBar
        percent={percentage}
        aria-label={`Assessment progress: ${String(percentage)}% complete, ${phaseLabel}`}
        animateFromZero={false}
        duration={0.3}
        delay={0}
      />
    </div>
  );
};
