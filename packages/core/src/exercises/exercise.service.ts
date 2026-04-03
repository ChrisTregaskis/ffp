import { getUserIdFromContext, type OrganisationContext } from '../lib/context';
import { withRLS } from '../lib/database';
import { ForbiddenError, NotFoundError } from '../lib/errors';
import { findProgrammeByUserId } from '../programmes/programme.repository';
import { runCascade } from '../sessions/cascade';
import * as sessionRepo from '../sessions/session.repository';

import * as exerciseRepo from './exercise.repository';

import type { ExerciseCompletionRecord } from './exercise.repository';
import type { CascadeResult } from '../schemas/session.schema';

/**
 * Toggle exercise completion and run cascading completion.
 *
 * Updates the exercise_completion record, then checks if the session,
 * phase, and programme should auto-complete. Returns cascade results
 * so the frontend can update accordingly.
 */
export async function toggleExerciseCompletion(
  completionId: string,
  completed: boolean,
  context: OrganisationContext
): Promise<{ exerciseCompletion: ExerciseCompletionRecord; cascade: CascadeResult }> {
  const userId = await getUserIdFromContext(context);
  const { organisationId } = context;

  return await withRLS(organisationId, userId, async (tx) => {
    // Fetch and validate completion exists
    const existing = await exerciseRepo.findExerciseCompletionById(tx, completionId);

    if (!existing) {
      throw new NotFoundError('Exercise completion', completionId);
    }

    // verify exercise belongs to user's active programme
    const programme = await findProgrammeByUserId(organisationId, userId, { tx });

    if (!programme) {
      throw new NotFoundError('Active programme');
    }

    const session = await sessionRepo.findUserSessionById(tx, existing.userSessionId);

    if (!session) {
      throw new NotFoundError('Session', existing.userSessionId);
    }

    const phase = await sessionRepo.findProgrammePhaseById(tx, session.programmePhaseId);

    if (!phase || phase.programmeId !== programme.id) {
      throw new ForbiddenError('Exercise does not belong to your active programme.');
    }

    // Toggle the completion
    const updatedCompletion = await exerciseRepo.toggleExerciseCompletion(
      tx,
      completionId,
      completed
    );

    // Run cascade — check session → phase → programme completion
    const cascade: CascadeResult = {
      sessionAutoCompleted: false,
      phaseCompleted: false,
      programmeCompleted: false,
    };

    if (completed && session.status !== 'completed' && session.status !== 'skipped') {
      // Check if all exercises in this session are now completed
      const counts = await exerciseRepo.countCompletionsBySessionId(tx, session.id);

      if (counts.total > 0 && counts.completed >= counts.total) {
        // Auto-complete the session
        await sessionRepo.updateSessionStatus(tx, session.id, 'completed', new Date());
        cascade.sessionAutoCompleted = true;

        // Run phase → programme cascade
        const phaseCascade = await runCascade(tx, session.programmePhaseId, programme.id);
        cascade.phaseCompleted = phaseCascade.phaseCompleted;
        cascade.programmeCompleted = phaseCascade.programmeCompleted;
      }
    }

    return {
      exerciseCompletion: updatedCompletion,
      cascade,
    };
  });
}
