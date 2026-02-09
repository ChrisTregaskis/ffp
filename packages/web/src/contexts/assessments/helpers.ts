import type { FlowStepType, FlowStepSummary } from '@ffp/core';

import type { AssessmentState } from './types';

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
 * Finds a step by ID and returns its order and type.
 * Returns null if step not found.
 */
export const findStepById = (
  steps: FlowStepSummary[],
  stepId: string
): { order: number; type: FlowStepType } | null => {
  const step = steps.find((s) => s.id === stepId);

  if (!step) {
    return null;
  }

  return { order: step.order, type: step.type as FlowStepType };
};

/**
 * Gets the phase (type) for a given step number.
 * Returns current phase if step not found.
 */
export const getPhaseForStep = (
  steps: FlowStepSummary[],
  stepNumber: number,
  currentPhase: FlowStepType
): FlowStepType => {
  const step = steps.find((s) => s.order === stepNumber);

  return step ? (step.type as FlowStepType) : currentPhase;
};
