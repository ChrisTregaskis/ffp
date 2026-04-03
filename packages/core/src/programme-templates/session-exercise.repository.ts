import { eq, max } from 'drizzle-orm';

import type { DbQueryClient } from '@ffp/database';
import { sessionExercises, type SessionExerciseRecord } from '@ffp/database/schema';
import { videos } from '@ffp/database/schema';

import type {
  CreateExerciseRequest,
  ExerciseVideoSummary,
  UpdateExerciseRequest,
} from '../schemas/programme/programme.schema';

/** Row shape returned by queries that join exercise + video data. */
export interface ExerciseWithVideo extends SessionExerciseRecord {
  video: ExerciseVideoSummary;
}

/** Lightweight video columns selected when joining exercises with video data. */
const videoSummaryColumns = {
  id: videos.id,
  title: videos.title,
  thumbnailKey: videos.thumbnailKey,
  status: videos.status,
} as const;

/** Returns all exercises for a session, ordered by orderIndex, with video data. */
export async function findExercisesBySessionId(
  db: DbQueryClient,
  sessionId: string
): Promise<ExerciseWithVideo[]> {
  const rows = await db
    .select({
      exercise: sessionExercises,
      video: videoSummaryColumns,
    })
    .from(sessionExercises)
    .innerJoin(videos, eq(sessionExercises.videoId, videos.id))
    .where(eq(sessionExercises.templateSessionId, sessionId))
    .orderBy(sessionExercises.orderIndex);

  return rows.map((row) => ({ ...row.exercise, video: row.video }));
}

/** Returns a single exercise by ID with video data, or null if not found. */
export async function findExerciseById(
  db: DbQueryClient,
  id: string
): Promise<ExerciseWithVideo | null> {
  const rows = await db
    .select({
      exercise: sessionExercises,
      video: videoSummaryColumns,
    })
    .from(sessionExercises)
    .innerJoin(videos, eq(sessionExercises.videoId, videos.id))
    .where(eq(sessionExercises.id, id))
    .limit(1);

  if (!rows[0]) {
    return null;
  }

  return { ...rows[0].exercise, video: rows[0].video };
}

/**
 * Inserts a new exercise for a session.
 * Auto-assigns orderIndex as max(existing) + 1 (0-based).
 * Prescription fields must already be pre-populated by the service layer.
 */
export async function insertExercise(
  db: DbQueryClient,
  sessionId: string,
  input: CreateExerciseRequest & { sets: number; reps: string }
): Promise<SessionExerciseRecord> {
  // Determine next orderIndex (0-based)
  const [result] = await db
    .select({ maxOrderIndex: max(sessionExercises.orderIndex) })
    .from(sessionExercises)
    .where(eq(sessionExercises.templateSessionId, sessionId));

  const nextOrderIndex = result.maxOrderIndex != null ? result.maxOrderIndex + 1 : 0;

  const records = await db
    .insert(sessionExercises)
    .values({
      templateSessionId: sessionId,
      videoId: input.videoId,
      orderIndex: nextOrderIndex,
      sets: input.sets,
      reps: input.reps,
      durationSeconds: input.durationSeconds ?? null,
      restSeconds: input.restSeconds ?? null,
      notes: input.notes ?? null,
    })
    .returning();

  return records[0];
}

/** Updates an exercise and returns the updated record, or null if not found. */
export async function updateExercise(
  db: DbQueryClient,
  id: string,
  data: UpdateExerciseRequest
): Promise<SessionExerciseRecord | null> {
  const records = await db
    .update(sessionExercises)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(sessionExercises.id, id))
    .returning();

  return records[0] ?? null;
}

/** Deletes an exercise by ID. Returns true if a row was deleted. */
export async function deleteExercise(db: DbQueryClient, id: string): Promise<boolean> {
  const result = await db.delete(sessionExercises).where(eq(sessionExercises.id, id)).returning();

  return result.length > 0;
}

/**
 * Reorders exercises for a session by updating orderIndex to match
 * the position in the orderedIds array (0-based).
 *
 * Temporarily sets orderIndex to negative values to avoid unique constraint
 * violations during reorder, then updates to final positions.
 */
export async function reorderExercises(
  db: DbQueryClient,
  sessionId: string,
  orderedIds: string[]
): Promise<ExerciseWithVideo[]> {
  // Set temporary negative values to avoid unique constraint conflicts
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(sessionExercises)
      .set({ orderIndex: -(i + 1), updatedAt: new Date() })
      .where(eq(sessionExercises.id, orderedIds[i]));
  }

  // Set final 0-based values
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(sessionExercises)
      .set({ orderIndex: i, updatedAt: new Date() })
      .where(eq(sessionExercises.id, orderedIds[i]));
  }

  // Return exercises in new order
  return await findExercisesBySessionId(db, sessionId);
}

/**
 * Re-numbers exercises for a session to maintain a contiguous 0-based sequence.
 * Used after an exercise is deleted to close gaps in orderIndex.
 */
export async function renumberExercises(db: DbQueryClient, sessionId: string): Promise<void> {
  const exercises = await findExercisesBySessionId(db, sessionId);

  for (let i = 0; i < exercises.length; i++) {
    if (exercises[i].orderIndex !== i) {
      await db
        .update(sessionExercises)
        .set({ orderIndex: i, updatedAt: new Date() })
        .where(eq(sessionExercises.id, exercises[i].id));
    }
  }
}
