import type {
  FlowStepType,
  FlowStepSummary,
  UserAssessmentScores,
  UserAnswer,
  AssessmentWarning,
} from '@ffp/core';

// ============================================================================
// Action Type Constants
// ============================================================================

/**
 * Action type constants for assessment reducer.
 *
 * Use these constants when dispatching actions to prevent typos
 * and enable IDE autocompletion.
 *
 * @example
 * dispatch({ type: ASSESSMENT_ACTION.SET_ANSWER, payload: { questionId, answer } });
 */
export const ASSESSMENT_ACTION = {
  START_ASSESSMENT: 'START_ASSESSMENT',
  SET_ANSWER: 'SET_ANSWER',
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  SET_PHASE: 'SET_PHASE',
  GO_TO_STEP: 'GO_TO_STEP',
  MARK_SAVED: 'MARK_SAVED',
  SET_SCORES: 'SET_SCORES',
  ADD_WARNING: 'ADD_WARNING',
  CLEAR_WARNINGS: 'CLEAR_WARNINGS',
  RESET: 'RESET',
} as const;

// ============================================================================
// State Types
// ============================================================================

/**
 * Assessment context state shape.
 *
 * Represents the complete client-side state for an active assessment.
 * Populated from StartAssessmentResponse and updated as user progresses.
 */
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

// Used when creating a new assessment context or after reset.
export const createInitialState = (flowId: string): AssessmentState => ({
  flowId,
  assessmentId: null,
  currentStep: 1,
  currentStepId: null,
  totalSteps: 0,
  steps: [],
  phase: 'intro',
  answers: {},
  isDirty: false,
  scores: null,
  warnings: [],
});

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
 * Set current phase action.
 *
 * Dispatched when transitioning between assessment phases.
 */
export interface SetPhaseAction {
  type: typeof ASSESSMENT_ACTION.SET_PHASE;
  payload: Pick<AssessmentState, 'phase'>;
}

/**
 * Navigate to specific step action.
 *
 * Dispatched for UUID-based navigation (e.g., after branching evaluation).
 */
export interface GoToStepAction {
  type: typeof ASSESSMENT_ACTION.GO_TO_STEP;
  payload: {
    stepId: string;
    stepNumber: number;
  };
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

/**
 * Add warning action.
 *
 * Dispatched when a branching rule triggers a warning.
 */
export interface AddWarningAction {
  type: typeof ASSESSMENT_ACTION.ADD_WARNING;
  payload: {
    warning: AssessmentWarning;
  };
}

/**
 * Clear warnings action.
 *
 * Dispatched to clear all warnings (e.g., after acknowledgement).
 */
export interface ClearWarningsAction {
  type: typeof ASSESSMENT_ACTION.CLEAR_WARNINGS;
}

/**
 * Reset assessment action.
 *
 * Dispatched to reset state to initial values.
 * Preserves flowId for starting a new assessment.
 */
export interface ResetAction {
  type: typeof ASSESSMENT_ACTION.RESET;
  /** Optional new flowId (defaults to current) */
  payload?: Partial<Pick<AssessmentState, 'flowId'>>;
}

/**
 * Union type of all assessment actions.
 *
 * Used by the reducer to handle state transitions.
 */
export type AssessmentAction =
  | StartAssessmentAction
  | SetAnswerAction
  | NextStepAction
  | PrevStepAction
  | SetPhaseAction
  | GoToStepAction
  | MarkSavedAction
  | SetScoresAction
  | AddWarningAction
  | ClearWarningsAction
  | ResetAction;

/**
 * Assessment context value type.
 *
 * Provides state and dispatch function to consumers.
 * The dispatch function accepts AssessmentAction for type-safe state updates.
 */
export interface AssessmentContextValue {
  /** Current assessment state */
  state: AssessmentState;

  /** Dispatch function for state updates */
  dispatch: React.Dispatch<AssessmentAction>;
}
