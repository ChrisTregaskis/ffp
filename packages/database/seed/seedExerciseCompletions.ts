import { asc, inArray } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type Pool } from 'pg';

import { createLogger } from '../src/lib/logger.js';
import { exerciseCompletions, userSessionExercises, userSessions } from '../src/schema/index.js';

import type { NewExerciseCompletion } from '../src/schema/exercise-completions.js';
import type * as schema from '../src/schema/index.js';
import type { UserSessionExerciseRecord } from '../src/schema/user-session-exercises.js';
import type { UserSessionRecord } from '../src/schema/user-sessions.js';

const logger = createLogger('seed-exercise-completions');

/** Minutes between one seeded exercise completion and the next */
const MINUTES_PER_EXERCISE = 4;

type SeedSession = Pick<UserSessionRecord, 'id' | 'organisationId' | 'status' | 'startedAt'>;
type SeedExercise = Pick<UserSessionExerciseRecord, 'id' | 'videoId' | 'orderIndex'>;

/**
 * The completion rows starting a session writes (one per member exercise, as `startSession`
 * does), filled in as far as the member got: every exercise of a completed session, the first
 * half (at least one) of an in-progress one. A session that has not been started has none.
 */
export const buildExerciseCompletions = (
  session: SeedSession,
  exercises: SeedExercise[]
): NewExerciseCompletion[] => {
  if (!session.startedAt || (session.status !== 'completed' && session.status !== 'in_progress')) {
    return [];
  }

  const startedAt = session.startedAt;
  const ordered = [...exercises].sort((a, b) => a.orderIndex - b.orderIndex);
  const doneCount =
    session.status === 'completed' ? ordered.length : Math.max(1, Math.floor(ordered.length / 2));

  return ordered.map((exercise, index) => {
    const completed = index < doneCount;

    return {
      organisationId: session.organisationId,
      userSessionId: session.id,
      userSessionExerciseId: exercise.id,
      videoId: exercise.videoId,
      completed,
      completedAt: completed
        ? new Date(startedAt.getTime() + (index + 1) * MINUTES_PER_EXERCISE * 60_000)
        : null,
    };
  });
};

/**
 * Seeds exercise completions for the started sessions of the given programme phases.
 * IDEMPOTENT — a session exercise that already has a completion keeps it.
 */
export const seedExerciseCompletions = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  programmePhaseIds: string[]
): Promise<void> => {
  logger.info('Seeding exercise completions...');

  const sessions = await db
    .select()
    .from(userSessions)
    .where(inArray(userSessions.programmePhaseId, programmePhaseIds));
  const startedSessionIds = sessions
    .filter((session) => session.startedAt !== null)
    .map((session) => session.id);

  if (startedSessionIds.length === 0) {
    logger.info('No started sessions; no completions to seed');

    return;
  }

  const exercises = await db
    .select()
    .from(userSessionExercises)
    .where(inArray(userSessionExercises.userSessionId, startedSessionIds))
    .orderBy(asc(userSessionExercises.orderIndex));

  const rows = sessions.flatMap((session) =>
    buildExerciseCompletions(
      session,
      exercises.filter((exercise) => exercise.userSessionId === session.id)
    )
  );

  const inserted =
    rows.length > 0
      ? await db
          .insert(exerciseCompletions)
          .values(rows)
          .onConflictDoNothing({
            target: [exerciseCompletions.userSessionId, exerciseCompletions.userSessionExerciseId],
          })
          .returning({ id: exerciseCompletions.id })
      : [];

  logger.info('Exercise completions seed complete', {
    created: inserted.length,
    alreadyExisted: rows.length - inserted.length,
  });
};
