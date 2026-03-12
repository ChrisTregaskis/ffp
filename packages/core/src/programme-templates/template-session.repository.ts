import { eq, max } from 'drizzle-orm';

import type { DbQueryClient } from '@ffp/database';
import { templateSessions, type TemplateSessionRecord } from '@ffp/database/schema';

import type { CreateSessionRequest, UpdateSessionRequest } from '../schemas/programme.schema';

/** Returns all sessions for a phase, ordered by sessionNumber. */
export async function findSessionsByPhaseId(
  db: DbQueryClient,
  phaseId: string
): Promise<TemplateSessionRecord[]> {
  return await db
    .select()
    .from(templateSessions)
    .where(eq(templateSessions.templatePhaseId, phaseId))
    .orderBy(templateSessions.sessionNumber);
}

/** Returns a single session by ID, or null if not found. */
export async function findSessionById(
  db: DbQueryClient,
  id: string
): Promise<TemplateSessionRecord | null> {
  const records = await db
    .select()
    .from(templateSessions)
    .where(eq(templateSessions.id, id))
    .limit(1);

  return records[0] ?? null;
}

/**
 * Inserts a new session for a phase.
 * Auto-assigns sessionNumber as max(existing) + 1.
 */
export async function insertSession(
  db: DbQueryClient,
  phaseId: string,
  input: CreateSessionRequest
): Promise<TemplateSessionRecord> {
  // Determine next sessionNumber
  const [result] = await db
    .select({ maxSessionNumber: max(templateSessions.sessionNumber) })
    .from(templateSessions)
    .where(eq(templateSessions.templatePhaseId, phaseId));

  const nextSessionNumber = (result.maxSessionNumber ?? 0) + 1;

  const records = await db
    .insert(templateSessions)
    .values({
      templatePhaseId: phaseId,
      sessionNumber: nextSessionNumber,
      name: input.name ?? null,
      description: input.description ?? null,
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
    })
    .returning();

  return records[0];
}

/** Updates a session and returns the updated record, or null if not found. */
export async function updateSession(
  db: DbQueryClient,
  id: string,
  data: UpdateSessionRequest
): Promise<TemplateSessionRecord | null> {
  const records = await db
    .update(templateSessions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(templateSessions.id, id))
    .returning();

  return records[0] ?? null;
}

/** Deletes a session by ID. Returns true if a row was deleted. DB cascade handles children. */
export async function deleteSession(db: DbQueryClient, id: string): Promise<boolean> {
  const result = await db.delete(templateSessions).where(eq(templateSessions.id, id)).returning();

  return result.length > 0;
}

/**
 * Reorders sessions for a phase by updating sessionNumber to match
 * the position in the orderedIds array (1-based).
 *
 * Temporarily sets sessionNumber to negative values to avoid unique constraint
 * violations during reorder, then updates to final positions.
 */
export async function reorderSessions(
  db: DbQueryClient,
  phaseId: string,
  orderedIds: string[]
): Promise<TemplateSessionRecord[]> {
  // Set temporary negative values to avoid unique constraint conflicts
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(templateSessions)
      .set({ sessionNumber: -(i + 1), updatedAt: new Date() })
      .where(eq(templateSessions.id, orderedIds[i]));
  }

  // Set final positive values
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(templateSessions)
      .set({ sessionNumber: i + 1, updatedAt: new Date() })
      .where(eq(templateSessions.id, orderedIds[i]));
  }

  // Return sessions in new order
  return await findSessionsByPhaseId(db, phaseId);
}

/**
 * Re-numbers sessions for a phase to maintain a contiguous sequence.
 * Used after a session is deleted to close gaps in sessionNumber.
 */
export async function renumberSessions(db: DbQueryClient, phaseId: string): Promise<void> {
  const sessions = await findSessionsByPhaseId(db, phaseId);

  for (let i = 0; i < sessions.length; i++) {
    const expectedNumber = i + 1;

    if (sessions[i].sessionNumber !== expectedNumber) {
      await db
        .update(templateSessions)
        .set({ sessionNumber: expectedNumber, updatedAt: new Date() })
        .where(eq(templateSessions.id, sessions[i].id));
    }
  }
}
