import * as sessionRepo from './session.repository';

import type { Transaction } from '../lib/database';
import type { CascadeResult } from '../schemas/session.schema';

/**
 * Cascading completion engine.
 *
 * Checks whether the phase should auto-complete (all sessions completed/skipped),
 * then whether the programme should auto-complete (all phases completed).
 * Early exit when cascade doesn't trigger.
 *
 * @internal Shared between session.service and exercise.service — do not import in handlers.
 */
export async function runCascade(
  tx: Transaction,
  programmePhaseId: string,
  programmeId: string
): Promise<CascadeResult> {
  const result: CascadeResult = {
    sessionCompleted: false,
    phaseCompleted: false,
    programmeCompleted: false,
  };

  // Check phase completion — are all sessions in this phase completed or skipped?
  const phase = await sessionRepo.findProgrammePhaseById(tx, programmePhaseId);

  if (!phase || phase.status === 'completed') {
    return result; // Already completed, nothing to cascade
  }

  // Count template sessions for this phase to know total expected
  const templateSessionCount = await sessionRepo.countTemplateSessionsByPhase(
    tx,
    phase.templatePhaseId
  );

  const sessionCounts = await sessionRepo.countSessionsByPhase(tx, programmePhaseId);

  // Phase is complete when all template sessions have user sessions that are completed/skipped
  if (
    sessionCounts.total >= templateSessionCount &&
    sessionCounts.completedOrSkipped >= templateSessionCount
  ) {
    await sessionRepo.updatePhaseStatus(tx, programmePhaseId, 'completed');
    result.phaseCompleted = true;

    // Check programme completion — are all phases completed?
    const phaseCounts = await sessionRepo.countPhasesByProgramme(tx, programmeId);

    if (phaseCounts.total > 0 && phaseCounts.completed >= phaseCounts.total) {
      await sessionRepo.updateProgrammeCompleted(tx, programmeId, new Date());
      result.programmeCompleted = true;
    }
  }

  return result;
}
