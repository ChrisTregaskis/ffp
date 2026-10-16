import type { FlowStepType } from '@ffp/core';

/**
 * Maps internal flow step type identifiers to user-friendly phase names
 * displayed in the progress bar.
 */
export const PHASE_LABELS: Record<FlowStepType, string> = {
  intro: 'Getting Started',
  questions: 'Pre-Assessment',
  transition: 'Preparing for Physical Assessment',
  'video-assessment': 'Physical Assessment',
  results: 'Your Results',
  'programme-overview': 'Programme Preview',
};

/**
 * Gets a human-readable label for a flow step type.
 */
export const getPhaseLabel = (phase: FlowStepType): string => {
  return PHASE_LABELS[phase];
};
