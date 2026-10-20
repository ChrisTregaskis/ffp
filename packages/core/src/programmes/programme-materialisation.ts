import { createUserSessions } from '../sessions/session.repository';
import { createUserSessionExercises } from '../sessions/user-session-exercise.repository';

import type { ProgrammePhaseRecord, TemplateStructure } from './programme.repository';
import type { Transaction } from '../lib/database';
import type { NewUserSession } from '../sessions/session.repository';
import type { NewUserSessionExercise } from '../sessions/user-session-exercise.repository';

/**
 * Copy the template's sessions (as not_started) and exercises into a new programme's member layer.
 * Runs in the transaction that created the phases, from the same template read.
 */
export async function materialiseProgrammeSessions(
  tx: Transaction,
  organisationId: string,
  templateStructure: TemplateStructure,
  phases: ProgrammePhaseRecord[]
): Promise<void> {
  const sessionInputs: NewUserSession[] = phases.flatMap((phase) =>
    (templateStructure.phases.get(phase.templatePhaseId)?.sessions ?? []).map(({ session }) => ({
      organisationId,
      programmePhaseId: phase.id,
      templateSessionId: session.id,
      sessionNumber: session.sessionNumber,
      status: 'not_started' as const,
    }))
  );

  const sessions = await createUserSessions(tx, sessionInputs);

  const templateExercisesBySession = new Map(
    [...templateStructure.phases.values()].flatMap(({ sessions: templateSessions }) =>
      templateSessions.map(({ session, exercises }) => [session.id, exercises] as const)
    )
  );

  const exerciseInputs: NewUserSessionExercise[] = sessions.flatMap((session) =>
    (templateExercisesBySession.get(session.templateSessionId) ?? []).map((exercise) => ({
      organisationId,
      userSessionId: session.id,
      sourceSessionExerciseId: exercise.id,
      videoId: exercise.videoId,
      orderIndex: exercise.orderIndex,
      sets: exercise.sets,
      reps: exercise.reps,
      durationSeconds: exercise.durationSeconds,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
    }))
  );

  await createUserSessionExercises(tx, exerciseInputs);
}
