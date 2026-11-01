import type { MemberSessionExerciseFields } from '@ffp/database';

import { createUserSessions } from '../sessions/session.repository';
import { createUserSessionExercises } from '../sessions/user-session-exercise.repository';

import type { ProgrammePhaseRecord, TemplateStructure } from './programme.repository';
import type { Transaction } from '../lib/database';
import type { NewUserSession } from '../sessions/session.repository';
import type { NewUserSessionExercise } from '../sessions/user-session-exercise.repository';

/**
 * Write the template's sessions (as not_started) and each session's chosen exercises into a new
 * programme's member layer. Runs in the transaction that created the phases.
 */
export async function materialiseProgrammeSessions(
  tx: Transaction,
  organisationId: string,
  templateStructure: TemplateStructure,
  phases: ProgrammePhaseRecord[],
  exercisesBySession: Map<string, MemberSessionExerciseFields[]>
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

  const exerciseInputs: NewUserSessionExercise[] = sessions.flatMap((session) =>
    (exercisesBySession.get(session.templateSessionId) ?? []).map((exercise) => ({
      organisationId,
      userSessionId: session.id,
      ...exercise,
    }))
  );

  await createUserSessionExercises(tx, exerciseInputs);
}
