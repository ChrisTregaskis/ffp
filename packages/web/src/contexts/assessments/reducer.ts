import { ASSESSMENT_ACTION } from './constants';
import { findStepById, getPhaseForStep } from './helpers';

import type { AssessmentState, AssessmentAction } from './types';

/**
 * Assessment reducer handling all state transitions.
 *
 * Active lifecycle:
 *   START_ASSESSMENT → SET_ANSWER → MARK_SAVED → NEXT_STEP / PREV_STEP → SET_SCORES
 *
 * - START_ASSESSMENT: Hydrates state from server (start or resume)
 * - SET_ANSWER: Records a user answer, marks state dirty
 * - MARK_SAVED: Clears dirty flag after successful API save
 * - NEXT_STEP: Advances forward (supports server-driven branching via nextStepId)
 * - PREV_STEP: Navigates backward (linear only)
 * - SET_SCORES: Stores results and transitions to results phase
 *
 * All state updates are immutable.
 */
export const assessmentReducer = (
  state: AssessmentState,
  action: AssessmentAction
): AssessmentState => {
  switch (action.type) {
    case ASSESSMENT_ACTION.START_ASSESSMENT: {
      const { assessmentId, currentStep, currentStepId, totalSteps, steps, answers, phase } =
        action.payload;

      return {
        ...state,
        assessmentId,
        currentStep,
        currentStepId,
        totalSteps,
        steps,
        answers,
        phase,
        isDirty: false,
        scores: null,
        warnings: [],
      };
    }

    case ASSESSMENT_ACTION.SET_ANSWER: {
      const { questionId, answer } = action.payload;

      return {
        ...state,
        answers: { ...state.answers, [questionId]: answer },
        isDirty: true,
      };
    }

    case ASSESSMENT_ACTION.CLEAR_ANSWER: {
      const { questionId } = action.payload;
      const { [questionId]: _, ...remainingAnswers } = state.answers;

      return {
        ...state,
        answers: remainingAnswers,
        isDirty: true,
      };
    }

    case ASSESSMENT_ACTION.NEXT_STEP: {
      // If nextStepId provided (from branching), navigate to that step
      if (action.payload?.nextStepId) {
        const stepInfo = findStepById(state.steps, action.payload.nextStepId);

        if (stepInfo) {
          return {
            ...state,
            currentStep: stepInfo.order,
            currentStepId: action.payload.nextStepId,
            phase: stepInfo.type,
          };
        }
      }

      // Default: linear navigation, respect totalSteps boundary
      const nextStep = Math.min(state.currentStep + 1, state.totalSteps);
      const nextStepData = state.steps.find((s) => s.order === nextStep);

      return {
        ...state,
        currentStep: nextStep,
        currentStepId: nextStepData?.id ?? state.currentStepId,
        phase: getPhaseForStep(state.steps, nextStep, state.phase),
      };
    }

    case ASSESSMENT_ACTION.PREV_STEP: {
      // Linear navigation backward, respect minimum of 1
      const prevStep = Math.max(state.currentStep - 1, 1);
      const prevStepData = state.steps.find((s) => s.order === prevStep);

      return {
        ...state,
        currentStep: prevStep,
        currentStepId: prevStepData?.id ?? state.currentStepId,
        phase: getPhaseForStep(state.steps, prevStep, state.phase),
      };
    }

    case ASSESSMENT_ACTION.MARK_SAVED: {
      return {
        ...state,
        isDirty: false,
      };
    }

    case ASSESSMENT_ACTION.SET_SCORES: {
      return {
        ...state,
        scores: action.payload.scores,
        phase: 'results',
      };
    }

    default: {
      // Exhaustive check - TypeScript will error if we miss an action type
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
};
