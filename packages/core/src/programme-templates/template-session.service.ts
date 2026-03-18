import { getDb } from '@ffp/database';
import type { TemplateSessionRecord } from '@ffp/database/schema';

import { NotFoundError, ValidationError } from '../lib/errors';
import {
  createSessionRequestSchema,
  updateSessionRequestSchema,
  reorderSessionsRequestSchema,
  sessionResponseSchema,
} from '../schemas/programme.schema';

import * as phaseRepository from './template-phase.repository';
import * as sessionRepository from './template-session.repository';

import type { SessionResponse } from '../schemas/programme.schema';

/** Maps a session record to the API response shape. */
const toResponse = (record: TemplateSessionRecord): SessionResponse =>
  sessionResponseSchema.parse(record);

/** Returns all sessions for a phase, ordered by sessionNumber. */
export async function listSessions(phaseId: string): Promise<SessionResponse[]> {
  const db = getDb();

  const phase = await phaseRepository.findPhaseById(db, phaseId);

  if (!phase) {
    throw new NotFoundError('Template phase', phaseId);
  }

  const sessions = await sessionRepository.findSessionsByPhaseId(db, phaseId);

  return sessions.map(toResponse);
}

/**
 * Creates a new session within a phase.
 * Auto-assigns sessionNumber and updates phase sessionCount.
 */
export async function createSession(phaseId: string, input: unknown): Promise<SessionResponse> {
  const validated = createSessionRequestSchema.parse(input);
  const db = getDb();

  // Create session and sync parent in a transaction
  const session = await db.transaction(async (tx) => {
    const phase = await phaseRepository.findPhaseById(tx, phaseId);

    if (!phase) {
      throw new NotFoundError('Template phase', phaseId);
    }

    const created = await sessionRepository.insertSession(tx, phaseId, validated);

    // Update phase sessionCount
    await phaseRepository.updateSessionCount(tx, phaseId, phase.sessionCount + 1);

    return created;
  });

  return toResponse(session);
}

/** Updates a session. Returns the updated session response. */
export async function updateSession(sessionId: string, input: unknown): Promise<SessionResponse> {
  const validated = updateSessionRequestSchema.parse(input);
  const db = getDb();

  const updated = await sessionRepository.updateSession(db, sessionId, validated);

  if (!updated) {
    throw new NotFoundError('Template session', sessionId);
  }

  return toResponse(updated);
}

/**
 * Deletes a session and updates phase sessionCount.
 * Re-numbers remaining sessions to maintain contiguous sequence.
 * DB cascade handles child exercises.
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDb();

  // Delete, renumber, and sync parent in a transaction
  await db.transaction(async (tx) => {
    const session = await sessionRepository.findSessionById(tx, sessionId);

    if (!session) {
      throw new NotFoundError('Template session', sessionId);
    }

    const phase = await phaseRepository.findPhaseById(tx, session.templatePhaseId);

    if (!phase) {
      throw new NotFoundError('Template phase', session.templatePhaseId);
    }

    await sessionRepository.deleteSession(tx, sessionId);
    await sessionRepository.renumberSessions(tx, session.templatePhaseId);
    await phaseRepository.updateSessionCount(
      tx,
      session.templatePhaseId,
      Math.max(phase.sessionCount - 1, 0)
    );
  });
}

/**
 * Reorders sessions within a phase.
 * Validates all provided IDs belong to the phase before reordering.
 */
export async function reorderSessions(phaseId: string, input: unknown): Promise<SessionResponse[]> {
  const validated = reorderSessionsRequestSchema.parse(input);
  const db = getDb();

  const phase = await phaseRepository.findPhaseById(db, phaseId);

  if (!phase) {
    throw new NotFoundError('Template phase', phaseId);
  }

  // Validate all IDs belong to this phase
  const existingSessions = await sessionRepository.findSessionsByPhaseId(db, phaseId);
  const existingIds = new Set(existingSessions.map((s) => s.id));

  const invalidIds = validated.orderedIds.filter((id) => !existingIds.has(id));

  if (invalidIds.length > 0) {
    throw new ValidationError('One or more session IDs do not belong to this phase');
  }

  if (validated.orderedIds.length !== existingSessions.length) {
    throw new ValidationError(
      `Expected ${String(existingSessions.length)} session IDs but received ${String(validated.orderedIds.length)}`
    );
  }

  // Reorder in a transaction
  const reordered = await db.transaction(async (tx) => {
    return await sessionRepository.reorderSessions(tx, phaseId, validated.orderedIds);
  });

  return reordered.map(toResponse);
}
