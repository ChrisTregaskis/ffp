import * as exerciseRepo from '../exercises/exercise.repository';
import { getUserIdFromContext, type OrganisationContext } from '../lib/context';
import { withRLS } from '../lib/database';
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors';
import { findProgrammeByUserId } from '../programmes/programme.repository';

import { runCascade } from './cascade';
import * as sessionRepo from './session.repository';

import type { UserSessionRecord } from './session.repository';
import type { ExerciseCompletionRecord } from '../exercises/exercise.repository';
import type { CascadeResult } from '../schemas/session.schema';

/**
 * Start a session (lazy creation).
 *
 * Idempotent — returns existing session if already started.
 * Creates exercise_completion rows from the template session's exercises.
 * Updates parent phase status to in_progress if this is the first session.
 */
export async function startSession(
  input: { programmePhaseId: string; templateSessionId: string },
  context: OrganisationContext
): Promise<UserSessionRecord & { exerciseCompletions: ExerciseCompletionRecord[] }> {
  const userId = await getUserIdFromContext(context);
  const { organisationId } = context;

  return await withRLS(organisationId, userId, async (tx) => {
    // verify the phase belongs to the user's active programme
    const programme = await findProgrammeByUserId(organisationId, userId, { tx });

    if (!programme) {
      throw new NotFoundError('Active programme');
    }

    const phase = await sessionRepo.findProgrammePhaseById(tx, input.programmePhaseId);

    if (!phase) {
      throw new NotFoundError('Programme phase', input.programmePhaseId);
    }

    if (phase.programmeId !== programme.id) {
      throw new ForbiddenError('Phase does not belong to your active programme.');
    }

    // Idempotent check — return existing session if already started
    const existing = await sessionRepo.findUserSessionByPhaseAndTemplate(
      tx,
      input.programmePhaseId,
      input.templateSessionId
    );

    if (existing) {
      const completions = await exerciseRepo.findCompletionsBySessionId(tx, existing.id);

      return {
        ...existing,
        exerciseCompletions: completions,
      };
    }

    // Look up template session to get sessionNumber
    const templateSession = await sessionRepo.findTemplateSessionById(tx, input.templateSessionId);

    if (!templateSession) {
      throw new NotFoundError('Template session', input.templateSessionId);
    }

    // Create the user session
    const now = new Date();
    const session = await sessionRepo.createUserSession(tx, {
      organisationId,
      programmePhaseId: input.programmePhaseId,
      templateSessionId: input.templateSessionId,
      sessionNumber: templateSession.sessionNumber,
      status: 'in_progress',
      startedAt: now,
    });

    // Create exercise completions from template exercises
    const templateExercises = await exerciseRepo.findSessionExercisesByTemplateSession(
      tx,
      input.templateSessionId
    );

    const completions = await exerciseRepo.createExerciseCompletions(
      tx,
      templateExercises.map((exercise) => ({
        organisationId,
        userSessionId: session.id,
        sessionExerciseId: exercise.id,
        videoId: exercise.videoId,
      }))
    );

    // Update phase status to in_progress if this is the first session
    if (phase.status === 'not_started') {
      await sessionRepo.updatePhaseStatus(tx, phase.id, 'in_progress');
    }

    // Update programme startedAt if not already set
    if (!programme.startedAt) {
      await sessionRepo.updateProgrammeStartedAt(tx, programme.id, now);
    }

    return {
      ...session,
      exerciseCompletions: completions,
    };
  });
}

/**
 * Complete a session manually.
 * Triggers cascading completion check (phase → programme).
 */
export async function completeSession(
  sessionId: string,
  context: OrganisationContext
): Promise<{ session: UserSessionRecord; cascade: CascadeResult }> {
  return await updateSessionWithCascade(sessionId, 'completed', context);
}

/**
 * Skip a session.
 * Triggers cascading completion check (phase → programme).
 */
export async function skipSession(
  sessionId: string,
  context: OrganisationContext
): Promise<{ session: UserSessionRecord; cascade: CascadeResult }> {
  return await updateSessionWithCascade(sessionId, 'skipped', context);
}

/**
 * Shared logic for complete/skip — updates session status and runs cascade.
 */
async function updateSessionWithCascade(
  sessionId: string,
  status: 'completed' | 'skipped',
  context: OrganisationContext
): Promise<{ session: UserSessionRecord; cascade: CascadeResult }> {
  const userId = await getUserIdFromContext(context);
  const { organisationId } = context;

  return await withRLS(organisationId, userId, async (tx) => {
    // Fetch and validate session ownership
    const session = await sessionRepo.findUserSessionById(tx, sessionId);

    if (!session) {
      throw new NotFoundError('Session', sessionId);
    }

    // verify session belongs to user's active programme
    const programme = await findProgrammeByUserId(organisationId, userId, { tx });

    if (!programme) {
      throw new NotFoundError('Active programme');
    }

    const phase = await sessionRepo.findProgrammePhaseById(tx, session.programmePhaseId);

    if (!phase || phase.programmeId !== programme.id) {
      throw new ForbiddenError('Session does not belong to your active programme.');
    }

    if (session.status === 'completed' || session.status === 'skipped') {
      throw new ValidationError(`Session is already ${session.status}.`);
    }

    // Update session status
    const now = new Date();
    const updatedSession = await sessionRepo.updateSessionStatus(tx, sessionId, status, now);

    // Run cascade
    const cascade = await runCascade(tx, session.programmePhaseId, programme.id);

    return { session: updatedSession, cascade };
  });
}
