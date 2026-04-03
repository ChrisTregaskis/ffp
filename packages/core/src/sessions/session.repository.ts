import { and, count, eq, inArray } from 'drizzle-orm';

import type { PhaseStatus, SessionStatus } from '@ffp/database/constants';
import {
  userSessions,
  programmePhases,
  programmes,
  templateSessions,
  type UserSessionRecord,
  type NewUserSession,
  type ProgrammePhaseRecord,
} from '@ffp/database/schema';

import { type Transaction } from '../lib/database';
import { NotFoundError } from '../lib/errors';

export type { UserSessionRecord, ProgrammePhaseRecord };

/** Creates a user session row within an existing RLS transaction. */
export async function createUserSession(
  tx: Transaction,
  input: NewUserSession
): Promise<UserSessionRecord> {
  const records = await tx.insert(userSessions).values(input).returning();

  if (records.length === 0) {
    throw new NotFoundError('Failed to create user session');
  }

  return records[0];
}

/** Finds a user session by ID within an existing RLS transaction. */
export async function findUserSessionById(
  tx: Transaction,
  sessionId: string
): Promise<UserSessionRecord | null> {
  const records = await tx
    .select()
    .from(userSessions)
    .where(eq(userSessions.id, sessionId))
    .limit(1);

  return records[0] ?? null;
}

/**
 * Finds an existing user session by phase and template session.
 * Used for idempotent session start — returns existing session if already created.
 */
export async function findUserSessionByPhaseAndTemplate(
  tx: Transaction,
  programmePhaseId: string,
  templateSessionId: string
): Promise<UserSessionRecord | null> {
  const records = await tx
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.programmePhaseId, programmePhaseId),
        eq(userSessions.templateSessionId, templateSessionId)
      )
    )
    .limit(1);

  return records[0] ?? null;
}

/** Updates session status and corresponding timestamp. */
export async function updateSessionStatus(
  tx: Transaction,
  sessionId: string,
  status: Extract<SessionStatus, 'in_progress' | 'completed' | 'skipped'>,
  timestamp: Date
): Promise<UserSessionRecord> {
  const updates: Partial<NewUserSession> = {
    status,
    updatedAt: timestamp,
  };

  if (status === 'in_progress') {
    updates.startedAt = timestamp;
  } else if (status === 'completed') {
    updates.completedAt = timestamp;
  } else {
    updates.skippedAt = timestamp;
  }

  const records = await tx
    .update(userSessions)
    .set(updates)
    .where(eq(userSessions.id, sessionId))
    .returning();

  if (records.length === 0) {
    throw new NotFoundError('Session', sessionId);
  }

  return records[0];
}

/** Sets pausedAt timestamp on a session (status remains in_progress). */
export async function pauseSession(
  tx: Transaction,
  sessionId: string,
  timestamp: Date
): Promise<UserSessionRecord> {
  const records = await tx
    .update(userSessions)
    .set({ pausedAt: timestamp, updatedAt: timestamp })
    .where(eq(userSessions.id, sessionId))
    .returning();

  if (records.length === 0) {
    throw new NotFoundError('Session', sessionId);
  }

  return records[0];
}

/** Clears pausedAt timestamp on a session (used when resuming). */
export async function clearPausedAt(tx: Transaction, sessionId: string): Promise<void> {
  await tx
    .update(userSessions)
    .set({ pausedAt: null, updatedAt: new Date() })
    .where(eq(userSessions.id, sessionId));
}

/** Finds the programme phase by ID within an existing RLS transaction. */
export async function findProgrammePhaseById(
  tx: Transaction,
  phaseId: string
): Promise<ProgrammePhaseRecord | null> {
  const records = await tx
    .select()
    .from(programmePhases)
    .where(eq(programmePhases.id, phaseId))
    .limit(1);

  return records[0] ?? null;
}

/** Updates the status of a programme phase. */
export async function updatePhaseStatus(
  tx: Transaction,
  phaseId: string,
  status: PhaseStatus
): Promise<void> {
  await tx
    .update(programmePhases)
    .set({ status, updatedAt: new Date() })
    .where(eq(programmePhases.id, phaseId));
}

/** Counts total and completed/skipped sessions for a given phase. */
export async function countSessionsByPhase(
  tx: Transaction,
  programmePhaseId: string
): Promise<{ total: number; completedOrSkipped: number }> {
  const [totalResult] = await tx
    .select({ value: count() })
    .from(userSessions)
    .where(eq(userSessions.programmePhaseId, programmePhaseId));

  const [completedResult] = await tx
    .select({ value: count() })
    .from(userSessions)
    .where(
      and(
        eq(userSessions.programmePhaseId, programmePhaseId),
        inArray(userSessions.status, ['completed', 'skipped'])
      )
    );

  return {
    total: totalResult.value,
    completedOrSkipped: completedResult.value,
  };
}

/**
 * Fetches the template session to get session_number for lazy creation.
 * No RLS required — template_sessions is a system-managed table.
 */
export async function findTemplateSessionById(
  tx: Transaction,
  templateSessionId: string
): Promise<{ id: string; sessionNumber: number; templatePhaseId: string } | null> {
  const records = await tx
    .select({
      id: templateSessions.id,
      sessionNumber: templateSessions.sessionNumber,
      templatePhaseId: templateSessions.templatePhaseId,
    })
    .from(templateSessions)
    .where(eq(templateSessions.id, templateSessionId))
    .limit(1);

  return records[0] ?? null;
}

/** Counts total phases and completed phases for a programme. */
export async function countPhasesByProgramme(
  tx: Transaction,
  programmeId: string
): Promise<{ total: number; completed: number }> {
  const [totalResult] = await tx
    .select({ value: count() })
    .from(programmePhases)
    .where(eq(programmePhases.programmeId, programmeId));

  const [completedResult] = await tx
    .select({ value: count() })
    .from(programmePhases)
    .where(
      and(eq(programmePhases.programmeId, programmeId), eq(programmePhases.status, 'completed'))
    );

  return {
    total: totalResult.value,
    completed: completedResult.value,
  };
}

/**
 * Counts total template sessions for a phase.
 * Used to determine if all sessions have been started/completed.
 */
export async function countTemplateSessionsByPhase(
  tx: Transaction,
  templatePhaseId: string
): Promise<number> {
  const [result] = await tx
    .select({ value: count() })
    .from(templateSessions)
    .where(eq(templateSessions.templatePhaseId, templatePhaseId));

  return result.value;
}

/** Sets programme startedAt. */
export async function updateProgrammeStartedAt(
  tx: Transaction,
  programmeId: string,
  timestamp: Date
): Promise<void> {
  await tx
    .update(programmes)
    .set({ startedAt: timestamp, updatedAt: timestamp })
    .where(eq(programmes.id, programmeId));
}

/** Marks a programme as completed. */
export async function updateProgrammeCompleted(
  tx: Transaction,
  programmeId: string,
  timestamp: Date
): Promise<void> {
  await tx
    .update(programmes)
    .set({ status: 'completed', completedAt: timestamp, updatedAt: timestamp })
    .where(eq(programmes.id, programmeId));
}
