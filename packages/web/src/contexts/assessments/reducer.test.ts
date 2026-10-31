import { describe, expect, it } from 'vitest';

import { ASSESSMENT_ACTION } from './constants';
import { createInitialState } from './helpers';
import { assessmentReducer } from './reducer';

import type { AssessmentState } from './types';

const FOCUS = 'question-focus';
const GOAL = 'question-goal';

const withErrors = (): AssessmentState => ({
  ...createInitialState('flow-1'),
  steps: [
    {
      id: 'step-goals',
      order: 2,
      type: 'questions',
      config: { title: 'Goals' },
      hasBranchingRules: false,
    },
  ],
  fieldErrors: { [FOCUS]: 'Choose up to 2 options.', [GOAL]: 'Please answer this question.' },
});

describe('assessmentReducer field errors', () => {
  it('replaces every field error on SET_FIELD_ERRORS', () => {
    const state = assessmentReducer(withErrors(), {
      type: ASSESSMENT_ACTION.SET_FIELD_ERRORS,
      payload: { fieldErrors: { [GOAL]: 'Choose one of the options shown.' } },
    });

    expect(state.fieldErrors).toEqual({ [GOAL]: 'Choose one of the options shown.' });
  });

  it('counts every refusal, including one that repeats the last', () => {
    const refusal = {
      type: ASSESSMENT_ACTION.SET_FIELD_ERRORS,
      payload: { fieldErrors: { [GOAL]: 'Please answer this question.' } },
    } as const;

    const once = assessmentReducer(createInitialState('flow-1'), refusal);
    const twice = assessmentReducer(once, refusal);

    expect(once.refusalCount).toBe(1);
    expect(twice.refusalCount).toBe(2);
  });

  it('clears only the answered question’s error', () => {
    const answered = assessmentReducer(withErrors(), {
      type: ASSESSMENT_ACTION.SET_ANSWER,
      payload: { questionId: FOCUS, answer: { questionId: FOCUS, answerValue: ['neck'] } },
    });

    expect(answered.fieldErrors).toEqual({ [GOAL]: 'Please answer this question.' });

    const cleared = assessmentReducer(answered, {
      type: ASSESSMENT_ACTION.CLEAR_ANSWER,
      payload: { questionId: GOAL },
    });

    expect(cleared.fieldErrors).toEqual({});
  });

  it('goes to a known step and ignores an unknown one', () => {
    const state = assessmentReducer(withErrors(), {
      type: ASSESSMENT_ACTION.GO_TO_STEP,
      payload: { stepId: 'step-goals' },
    });

    expect(state).toEqual(
      expect.objectContaining({ currentStep: 2, currentStepId: 'step-goals', phase: 'questions' })
    );

    const unchanged = withErrors();

    expect(
      assessmentReducer(unchanged, {
        type: ASSESSMENT_ACTION.GO_TO_STEP,
        payload: { stepId: 'missing' },
      })
    ).toBe(unchanged);
  });

  it('starts with no field errors', () => {
    const state = assessmentReducer(withErrors(), {
      type: ASSESSMENT_ACTION.START_ASSESSMENT,
      payload: {
        assessmentId: 'assessment-1',
        currentStep: 1,
        currentStepId: null,
        totalSteps: 0,
        steps: [],
        answers: {},
        phase: 'intro',
      },
    });

    expect(state.fieldErrors).toEqual({});
  });
});
