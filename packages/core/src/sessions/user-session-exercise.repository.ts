import { asc, eq } from 'drizzle-orm';

import {
  userSessionExercises,
  type NewUserSessionExercise,
  type UserSessionExerciseRecord,
} from '@ffp/database/schema';

import { type Transaction } from '../lib/database';

export type { UserSessionExerciseRecord, NewUserSessionExercise };

/** The video, prescription and template link an admin edit can change on a member's exercise */
export type UserSessionExerciseChanges = Partial<
  Pick<
    NewUserSessionExercise,
    | 'videoId'
    | 'sourceSessionExerciseId'
    | 'sets'
    | 'reps'
    | 'durationSeconds'
    | 'restSeconds'
    | 'notes'
  >
>;

/** Batch creates a member's session exercise rows within an existing RLS transaction. */
export async function createUserSessionExercises(
  tx: Transaction,
  exercises: NewUserSessionExercise[]
): Promise<UserSessionExerciseRecord[]> {
  if (exercises.length === 0) {
    return [];
  }

  return await tx.insert(userSessionExercises).values(exercises).returning();
}

/** Finds a member session's exercises, in order, within an existing RLS transaction. */
export async function findUserSessionExercisesBySessionId(
  tx: Transaction,
  userSessionId: string
): Promise<UserSessionExerciseRecord[]> {
  return await tx
    .select()
    .from(userSessionExercises)
    .where(eq(userSessionExercises.userSessionId, userSessionId))
    .orderBy(asc(userSessionExercises.orderIndex));
}

/** Finds a member's exercise by ID within an existing RLS transaction. */
export async function findUserSessionExerciseById(
  tx: Transaction,
  exerciseId: string
): Promise<UserSessionExerciseRecord | null> {
  const records = await tx
    .select()
    .from(userSessionExercises)
    .where(eq(userSessionExercises.id, exerciseId))
    .limit(1);

  return records[0] ?? null;
}

/** Updates a member's exercise and returns it, or null if it no longer exists. */
export async function updateUserSessionExercise(
  tx: Transaction,
  exerciseId: string,
  changes: UserSessionExerciseChanges
): Promise<UserSessionExerciseRecord | null> {
  const records = await tx
    .update(userSessionExercises)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(userSessionExercises.id, exerciseId))
    .returning();

  return records[0] ?? null;
}

/** Deletes a member's exercise. Returns true if a row was deleted. */
export async function deleteUserSessionExercise(
  tx: Transaction,
  exerciseId: string
): Promise<boolean> {
  const records = await tx
    .delete(userSessionExercises)
    .where(eq(userSessionExercises.id, exerciseId))
    .returning({ id: userSessionExercises.id });

  return records.length > 0;
}

/**
 * Sets each exercise's orderIndex to its position in orderedIds (0-based). The unique index on
 * (session, order) is not deferrable, so every row moves to a negative index first.
 */
export async function reorderUserSessionExercises(
  tx: Transaction,
  userSessionId: string,
  orderedIds: string[]
): Promise<UserSessionExerciseRecord[]> {
  for (let i = 0; i < orderedIds.length; i++) {
    await tx
      .update(userSessionExercises)
      .set({ orderIndex: -(i + 1), updatedAt: new Date() })
      .where(eq(userSessionExercises.id, orderedIds[i]));
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await tx
      .update(userSessionExercises)
      .set({ orderIndex: i, updatedAt: new Date() })
      .where(eq(userSessionExercises.id, orderedIds[i]));
  }

  return await findUserSessionExercisesBySessionId(tx, userSessionId);
}

/** Closes the gap a removed exercise leaves, keeping the session's order contiguous from 0. */
export async function renumberUserSessionExercises(
  tx: Transaction,
  userSessionId: string
): Promise<void> {
  const exercises = await findUserSessionExercisesBySessionId(tx, userSessionId);

  for (let i = 0; i < exercises.length; i++) {
    if (exercises[i].orderIndex !== i) {
      await tx
        .update(userSessionExercises)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(eq(userSessionExercises.id, exercises[i].id));
    }
  }
}
