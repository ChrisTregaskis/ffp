import { eq, and, sql } from 'drizzle-orm';

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
  const [record] = await tx.insert(userSessions).values(input).returning();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- belt-and-braces guard on .returning()
  if (!record) {
    throw new NotFoundError('Failed to create user session');
  }

  return record;
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
  status: 'in_progress' | 'completed' | 'skipped',
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

  const [record] = await tx
    .update(userSessions)
    .set(updates)
    .where(eq(userSessions.id, sessionId))
    .returning();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- belt-and-braces guard on .returning()
  if (!record) {
    throw new NotFoundError('Session', sessionId);
  }

  return record;
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
  status: 'not_started' | 'in_progress' | 'completed'
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
  const result = await tx
    .select({
      total: sql<number>`count(*)::int`,
      completedOrSkipped: sql<number>`count(*) filter (where ${userSessions.status} in ('completed', 'skipped'))::int`,
    })
    .from(userSessions)
    .where(eq(userSessions.programmePhaseId, programmePhaseId));

  return result[0] ?? { total: 0, completedOrSkipped: 0 };
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
  const result = await tx
    .select({
      total: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${programmePhases.status} = 'completed')::int`,
    })
    .from(programmePhases)
    .where(eq(programmePhases.programmeId, programmeId));

  return result[0] ?? { total: 0, completed: 0 };
}

/**
 * Counts total template sessions for a phase.
 * Used to determine if all sessions have been started/completed.
 * No RLS required — template_sessions is a system-managed table.
 */
export async function countTemplateSessionsByPhase(
  tx: Transaction,
  templatePhaseId: string
): Promise<number> {
  const result = await tx
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(templateSessions)
    .where(eq(templateSessions.templatePhaseId, templatePhaseId));

  return result[0]?.count ?? 0;
}

/** Sets programme startedAt if not already set. */
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
