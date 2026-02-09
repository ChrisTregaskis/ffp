import { useReducer, type ReactNode } from 'react';

import { AssessmentContext } from './AssessmentContext';
import { createInitialState } from './helpers';
import { assessmentReducer } from './reducer';

/**
 * Props for AssessmentProvider component.
 */
interface AssessmentProviderProps {
  /** Assessment flow ID to initialise state with */
  flowId: string;
  /** Child components that need access to assessment state */
  children: ReactNode;
}

/**
 * Assessment provider component that manages assessment state.
 *
 * Wraps assessment pages to provide context with state and dispatch.
 * Uses useReducer with assessmentReducer for state management.
 *
 * @example
 * ```tsx
 * <AssessmentProvider flowId="flow-uuid-123">
 *   <AssessmentPage />
 * </AssessmentProvider>
 * ```
 */
export const AssessmentProvider = ({ flowId, children }: AssessmentProviderProps): JSX.Element => {
  const [assessmentState, assessmentDispatch] = useReducer(
    assessmentReducer,
    flowId,
    createInitialState
  );

  return (
    <AssessmentContext.Provider value={{ assessmentState, assessmentDispatch }}>
      {children}
    </AssessmentContext.Provider>
  );
};
