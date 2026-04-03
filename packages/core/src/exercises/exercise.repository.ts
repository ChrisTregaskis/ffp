import { and, count, eq } from 'drizzle-orm';

import {
  exerciseCompletions,
  sessionExercises,
  type ExerciseCompletionRecord,
  type NewExerciseCompletion,
  type SessionExerciseRecord,
} from '@ffp/database/schema';

import { type Transaction } from '../lib/database';
import { NotFoundError } from '../lib/errors';

export type { ExerciseCompletionRecord, SessionExerciseRecord };

/** Batch creates exercise completion rows for a newly started session. */
export async function createExerciseCompletions(
  tx: Transaction,
  completions: NewExerciseCompletion[]
): Promise<ExerciseCompletionRecord[]> {
  if (completions.length === 0) {
    return [];
  }

  return await tx.insert(exerciseCompletions).values(completions).returning();
}

/** Toggles exercise completion status and timestamps. */
export async function toggleExerciseCompletion(
  tx: Transaction,
  completionId: string,
  completed: boolean
): Promise<ExerciseCompletionRecord> {
  const records = await tx
    .update(exerciseCompletions)
    .set({
      completed,
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(exerciseCompletions.id, completionId))
    .returning();

  if (records.length === 0) {
    throw new NotFoundError('Exercise completion', completionId);
  }

  return records[0];
}

/** Finds a single exercise completion by ID. */
export async function findExerciseCompletionById(
  tx: Transaction,
  completionId: string
): Promise<ExerciseCompletionRecord | null> {
  const records = await tx
    .select()
    .from(exerciseCompletions)
    .where(eq(exerciseCompletions.id, completionId))
    .limit(1);

  return records[0] ?? null;
}

/** Finds all exercise completions for a session. */
export async function findCompletionsBySessionId(
  tx: Transaction,
  userSessionId: string
): Promise<ExerciseCompletionRecord[]> {
  return await tx
    .select()
    .from(exerciseCompletions)
    .where(eq(exerciseCompletions.userSessionId, userSessionId));
}

/** Counts total and completed exercises for a given session. */
export async function countCompletionsBySessionId(
  tx: Transaction,
  userSessionId: string
): Promise<{ total: number; completed: number }> {
  const [totalResult] = await tx
    .select({ value: count() })
    .from(exerciseCompletions)
    .where(eq(exerciseCompletions.userSessionId, userSessionId));

  const [completedResult] = await tx
    .select({ value: count() })
    .from(exerciseCompletions)
    .where(
      and(
        eq(exerciseCompletions.userSessionId, userSessionId),
        eq(exerciseCompletions.completed, true)
      )
    );

  return {
    total: totalResult.value,
    completed: completedResult.value,
  };
}

/**
 * Fetches session exercises for a template session (ordered by orderIndex).
 * No RLS required — session_exercises is a system-managed table.
 */
export async function findSessionExercisesByTemplateSession(
  tx: Transaction,
  templateSessionId: string
): Promise<SessionExerciseRecord[]> {
  return await tx
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.templateSessionId, templateSessionId))
    .orderBy(sessionExercises.orderIndex);
}
