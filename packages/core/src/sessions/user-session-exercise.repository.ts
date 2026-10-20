import {
  userSessionExercises,
  type NewUserSessionExercise,
  type UserSessionExerciseRecord,
} from '@ffp/database/schema';

import { type Transaction } from '../lib/database';

export type { UserSessionExerciseRecord, NewUserSessionExercise };

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
