import type {
  FlowStepType,
  FlowStepSummary,
  UserAssessmentScores,
  UserAnswer,
  AssessmentWarning,
} from '@ffp/core';

import { type ASSESSMENT_ACTION } from './constants';

export interface AssessmentState {
  /** Assessment flow ID being followed */
  flowId: string;
  /** Unique identifier for this assessment (null until started) */
  assessmentId: string | null;
  /** Current step index in the flow (1-based) */
  currentStep: number;
  /** Current step UUID for step-based navigation (null until started) */
  currentStepId: string | null;
  /** Total number of steps in the flow */
  totalSteps: number;
  /** Flow steps for client-side navigation (from StartAssessmentResponse) */
  steps: FlowStepSummary[];
  /** Current phase/type of the assessment step */
  phase: FlowStepType;
  /** User's answers keyed by questionId */
  answers: Record<string, UserAnswer>;
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Calculated scores (null until assessment is scored) */
  scores: UserAssessmentScores | null;
  /** Warnings displayed during assessment (from branching rules) */
  warnings: AssessmentWarning[];
}

/**
 * Start assessment action.
 *
 * Dispatched when an assessment is started or resumed.
 * Populates state from StartAssessmentResponse.
 */
export interface StartAssessmentAction {
  type: typeof ASSESSMENT_ACTION.START_ASSESSMENT;
  payload: Pick<
    AssessmentState,
    'currentStep' | 'currentStepId' | 'totalSteps' | 'steps' | 'answers' | 'phase'
  > & {
    assessmentId: string;
  };
}

/**
 * Set answer action.
 *
 * Dispatched when user answers a question.
 * Marks state as dirty until saved.
 */
export interface SetAnswerAction {
  type: typeof ASSESSMENT_ACTION.SET_ANSWER;
  payload: {
    questionId: string;
    answer: UserAnswer;
  };
}

/**
 * Clear answer action.
 *
 * Dispatched when user clears a previously answered question (e.g. numeric input deletion).
 * Removes the answer from state and marks state as dirty.
 */
export interface ClearAnswerAction {
  type: typeof ASSESSMENT_ACTION.CLEAR_ANSWER;
  payload: {
    questionId: string;
  };
}

/**
 * Navigate to next step action.
 *
 * Dispatched when user clicks Continue/Next.
 * Optionally includes nextStepId from branching evaluation.
 */
export interface NextStepAction {
  type: typeof ASSESSMENT_ACTION.NEXT_STEP;
  payload?: {
    /** Next step ID from branching evaluation (optional) */
    nextStepId?: string;
  };
}

/**
 * Navigate to previous step action.
 *
 * Dispatched when user clicks Back.
 */
export interface PrevStepAction {
  type: typeof ASSESSMENT_ACTION.PREV_STEP;
}

/**
 * Mark as saved action.
 *
 * Dispatched after successful save to API.
 * Resets isDirty to false.
 */
export interface MarkSavedAction {
  type: typeof ASSESSMENT_ACTION.MARK_SAVED;
}

/**
 * Set scores action.
 *
 * Dispatched when assessment scoring is complete.
 */
export interface SetScoresAction {
  type: typeof ASSESSMENT_ACTION.SET_SCORES;
  payload: {
    scores: UserAssessmentScores;
  };
}

// Union type of all assessment actions.
export type AssessmentAction =
  | StartAssessmentAction
  | SetAnswerAction
  | ClearAnswerAction
  | NextStepAction
  | PrevStepAction
  | MarkSavedAction
  | SetScoresAction;

/**
 * Assessment context value type.
 *
 * Provides state and dispatch function to consumers.
 * The dispatch function accepts AssessmentAction for type-safe state updates.
 */
export interface AssessmentContextValue {
  /** Current assessment state */
  assessmentState: AssessmentState;

  /** Dispatch function for state updates */
  assessmentDispatch: React.Dispatch<AssessmentAction>;
}
