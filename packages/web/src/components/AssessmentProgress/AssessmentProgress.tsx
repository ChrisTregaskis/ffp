import { useMemo } from 'react';

import type { FlowStepType } from '@ffp/core';

import { Text } from '@web/components/text';

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
    <div
      className={`w-full ${className}`.trim()}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Assessment progress: ${String(percentage)}% complete, ${phaseLabel}`}
    >
      {/* Phase label and step counter row */}
      <div className="mb-2 flex items-center justify-between">
        <Text as="span" styleProps={{ size: 'sm', weight: 'medium', colour: 'foreground' }}>
          {phaseLabel}
        </Text>
        <Text as="span" styleProps={{ size: 'sm', colour: 'muted-foreground' }}>
          {currentStep}/{totalSteps}
        </Text>
      </div>

      {/* Progress bar track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-linear-to-r from-ffp-primary-blue to-ffp-dark-blue transition-all duration-300 ease-out"
          style={{ width: `${String(percentage)}%` }}
        />
      </div>
    </div>
  );
};
