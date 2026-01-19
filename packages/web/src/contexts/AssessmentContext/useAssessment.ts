import { useContext } from 'react';

import { AssessmentContext } from './AssessmentContext';

import type { AssessmentContextValue } from './types';

/**
 * Custom hook to access assessment context.
 *
 * Provides access to assessment state and dispatch function for
 * managing assessment flow navigation, answers, and scoring.
 *
 * Must be used within an AssessmentProvider component.
 *
 * @returns Assessment context value containing assessmentState and assessmentDispatch
 * @throws Error if used outside of AssessmentProvider
 *
 * @example
 * ```tsx
 * const { assessmentState, assessmentDispatch } = useAssessment();
 *
 * // Access current step
 * console.log(assessmentState.currentStep);
 *
 * // Dispatch an action
 * assessmentDispatch({ type: ASSESSMENT_ACTION.NEXT_STEP });
 * ```
 */

export const useAssessment = (): AssessmentContextValue => {
  const context = useContext(AssessmentContext);

  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }

  return context;
};
