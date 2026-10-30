import type { ProgrammeDetailResponse } from '@ffp/core';

import { ApiError } from '@web/lib/api/client';

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

/** A completed or skipped session is done, as the server counts it when it closes a phase */
export const isSessionDone = (session: Session): boolean => {
  const status = session.userSession?.status;

  return status === 'completed' || status === 'skipped';
};

export const countDoneSessions = (sessions: Session[]): number =>
  sessions.filter(isSessionDone).length;

/** Find the next session in a phase that is not done */
export const findNextSession = (phase: Phase): Session | undefined =>
  phase.sessions.find((s) => !isSessionDone(s));

/** A failed programme query; a not-found means there is no active programme, which is not a failure */
export const isProgrammeLoadFailure = (error: unknown): boolean =>
  error != null && !(ApiError.isApiError(error) && error.isNotFound);
