import type { ProgrammeDetailResponse } from '@ffp/core';

type Phase = ProgrammeDetailResponse['phases'][number];
type Session = Phase['sessions'][number];

/** Find the current phase (first in_progress or not_started) */
export const findCurrentPhase = (
  phases: Phase[],
  currentPhaseNumber: number | null
): Phase | undefined => {
  if (currentPhaseNumber !== null) {
    return phases.find((p) => p.phaseNumber === currentPhaseNumber);
  }

  return phases.find((p) => p.status === 'in_progress' || p.status === 'not_started');
};

/** Find the next uncompleted session in a phase */
export const findNextSession = (phase: Phase): Session | undefined => {
  return phase.sessions.find((s) => {
    const status = s.userSession?.status;

    return !status || status === 'not_started' || status === 'in_progress';
  });
};
