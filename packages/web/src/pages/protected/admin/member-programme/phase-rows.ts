import type { AdminProgrammeDetailResponse } from '@ffp/core';

import { countDoneSessions } from '@web/utils/programme';

type Phase = AdminProgrammeDetailResponse['phases'][number];

/** Row shape for a member's phases table */
export type MemberPhaseRow = {
  id: string;
  publicId: string;
  phaseNumber: number;
  name: string;
  status: Phase['status'];
  sessionsDone: number;
  sessionCount: number;
} & Record<string, unknown>;

export const toMemberPhaseRow = (phase: Phase): MemberPhaseRow => ({
  id: phase.id,
  publicId: phase.publicId,
  phaseNumber: phase.phaseNumber,
  name: phase.name ?? `Phase ${String(phase.phaseNumber)}`,
  status: phase.status,
  sessionsDone: countDoneSessions(phase.sessions),
  sessionCount: phase.sessions.length,
});
