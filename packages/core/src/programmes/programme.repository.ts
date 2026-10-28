import { eq, and, inArray, asc, desc, count } from 'drizzle-orm';

import {
  programmes,
  programmeTemplates,
  templatePhases,
  templateSessions,
  sessionExercises,
  programmePhases,
  userSessions,
  userSessionExercises,
  exerciseCompletions,
  videos,
  type ProgrammeRecord,
  type ProgrammeTemplateRecord,
  type TemplatePhaseRecord,
  type NewProgrammePhase,
  type ProgrammePhaseRecord,
  type TemplateSessionRecord,
  type SessionExerciseRecord,
  type VideoRecord,
} from '@ffp/database/schema';

import { db, withRLS, type Transaction } from '../lib/database';
import { type CreateProgrammeInput } from '../schemas/programme/programme.schema';

import { isCurrentProgramme } from './current-programme';

export type Programme = ProgrammeRecord;

export interface CreateProgrammeOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

export interface FindByUserIdOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

export interface FindByIdOptions {
  /** Optional user ID for fine-grained RLS */
  userId?: string;
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

export interface FindTemplateBySlugOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

export interface ArchiveProgrammeOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
  /** Why the programme was archived (e.g., 'reassessment', 'manual', 'expired') */
  reason?: string;
}

export interface SetReplacementProgrammeOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

export interface CreateProgrammePhasesOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

/** Programme with its phases, returned from findProgrammeWithPhases. */
export interface ProgrammeWithPhases {
  programme: ProgrammeRecord;
  phases: ProgrammePhaseRecord[];
  template: { name: string; slug: string; difficulty: string | null } | null;
}

/** Slim video fields needed for exercise detail display. */
export type ExerciseVideoSummary = Pick<
  VideoRecord,
  'id' | 'title' | 'durationSeconds' | 'difficulty'
>;

/** Exercise record with embedded video metadata. */
export type ExerciseWithVideo = SessionExerciseRecord & { video: ExerciseVideoSummary };

/** Full template session with exercises and video metadata. */
export interface TemplateSessionWithExercises {
  session: TemplateSessionRecord;
  exercises: ExerciseWithVideo[];
}

/** Template phase with its sessions, used within TemplateStructure. */
export interface TemplatePhaseWithSessions {
  phase: TemplatePhaseRecord;
  sessions: TemplateSessionWithExercises[];
}

/** Template structure keyed by template phase ID. */
export interface TemplateStructure {
  phases: Map<string, TemplatePhaseWithSessions>;
}

/** Aggregate progress counts for a programme. */
export interface ProgressCounts {
  phases: { total: number; completed: number };
  sessions: { total: number; completed: number; skipped: number };
  exercises: { total: number; completed: number };
  currentPhase: { totalSessions: number; completedOrSkippedSessions: number };
}

async function createProgrammeInTx(
  tx: Transaction,
  input: CreateProgrammeInput
): Promise<Programme> {
  const [record] = await tx
    .insert(programmes)
    .values({
      organisationId: input.organisationId,
      userId: input.userId,
      programmeTemplateId: input.programmeTemplateId,
      name: input.name,
      description: input.description ?? null,
      totalPhases: input.totalPhases ?? null,
    })
    .returning();

  return record;
}

async function findProgrammeByUserIdInTx(
  tx: Transaction,
  userId: string
): Promise<Programme | null> {
  const records = await tx
    .select()
    .from(programmes)
    .where(and(eq(programmes.userId, userId), inArray(programmes.status, ['active', 'completed'])))
    .orderBy(desc(programmes.createdAt))
    .limit(1);

  return records[0] ?? null;
}

async function hasAnyProgrammeByUserIdInTx(tx: Transaction, userId: string): Promise<boolean> {
  const records = await tx
    .select({ id: programmes.id })
    .from(programmes)
    .where(eq(programmes.userId, userId))
    .limit(1);

  return records.length > 0;
}

async function findProgrammeByIdInTx(
  tx: Transaction,
  programmeId: string
): Promise<Programme | null> {
  const records = await tx.select().from(programmes).where(eq(programmes.id, programmeId)).limit(1);

  return records[0] ?? null;
}

async function archiveProgrammeInTx(
  tx: Transaction,
  programmeId: string,
  userId: string,
  reason?: string
): Promise<void> {
  await tx
    .update(programmes)
    .set({
      status: 'archived',
      archivedAt: new Date(),
      archivedReason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(programmes.id, programmeId), eq(programmes.userId, userId)));
}

async function setReplacementProgrammeInTx(
  tx: Transaction,
  archivedProgrammeId: string,
  replacementProgrammeId: string
): Promise<void> {
  await tx
    .update(programmes)
    .set({
      replacedByProgrammeId: replacementProgrammeId,
      updatedAt: new Date(),
    })
    .where(eq(programmes.id, archivedProgrammeId));
}

async function findTemplateBySlugInTx(
  tx: Transaction,
  slug: string
): Promise<ProgrammeTemplateRecord | null> {
  const records = await tx
    .select()
    .from(programmeTemplates)
    .where(eq(programmeTemplates.slug, slug))
    .limit(1);

  return records[0] ?? null;
}

async function createProgrammePhasesInTx(
  tx: Transaction,
  phases: NewProgrammePhase[]
): Promise<ProgrammePhaseRecord[]> {
  if (phases.length === 0) {
    return [];
  }

  return await tx.insert(programmePhases).values(phases).returning();
}

export async function createProgramme(
  input: CreateProgrammeInput,
  options: CreateProgrammeOptions = {}
): Promise<Programme> {
  const { tx } = options;

  if (tx) {
    return createProgrammeInTx(tx, input);
  }

  return await withRLS(input.organisationId, input.userId, async (newTx) => {
    return createProgrammeInTx(newTx, input);
  });
}

/** Returns the first active programme for the given user within the organisation. */
export async function findProgrammeByUserId(
  organisationId: string,
  userId: string,
  options: FindByUserIdOptions = {}
): Promise<Programme | null> {
  const { tx } = options;

  if (tx) {
    return findProgrammeByUserIdInTx(tx, userId);
  }

  return await withRLS(organisationId, userId, async (newTx) => {
    return findProgrammeByUserIdInTx(newTx, userId);
  });
}

/** Checks whether any programme exists for the user (regardless of status). */
export async function hasAnyProgrammeByUserId(
  organisationId: string,
  userId: string,
  options: FindByUserIdOptions = {}
): Promise<boolean> {
  const { tx } = options;

  if (tx) {
    return hasAnyProgrammeByUserIdInTx(tx, userId);
  }

  return await withRLS(organisationId, userId, async (newTx) => {
    return hasAnyProgrammeByUserIdInTx(newTx, userId);
  });
}

export async function findProgrammeById(
  organisationId: string,
  programmeId: string,
  options: FindByIdOptions = {}
): Promise<Programme | null> {
  const { userId, tx } = options;

  if (tx) {
    return findProgrammeByIdInTx(tx, programmeId);
  }

  return await withRLS(organisationId, userId, async (newTx) => {
    return findProgrammeByIdInTx(newTx, programmeId);
  });
}

/** Archives a programme — sets status, archivedAt, and optional reason. */
export async function archiveProgramme(
  organisationId: string,
  programmeId: string,
  userId: string,
  options: ArchiveProgrammeOptions = {}
): Promise<void> {
  const { tx, reason } = options;

  if (tx) {
    return archiveProgrammeInTx(tx, programmeId, userId, reason);
  }

  await withRLS(organisationId, userId, async (newTx) => {
    return archiveProgrammeInTx(newTx, programmeId, userId, reason);
  });
}

/** Links an archived programme to its replacement (sets replacedByProgrammeId). */
export async function setReplacementProgramme(
  organisationId: string,
  archivedProgrammeId: string,
  replacementProgrammeId: string,
  options: SetReplacementProgrammeOptions = {}
): Promise<void> {
  const { tx } = options;

  if (tx) {
    return setReplacementProgrammeInTx(tx, archivedProgrammeId, replacementProgrammeId);
  }

  await withRLS(organisationId, undefined, async (newTx) => {
    return setReplacementProgrammeInTx(newTx, archivedProgrammeId, replacementProgrammeId);
  });
}

/** Looks up a programme template by slug. No RLS required (system-managed table). */
export async function findTemplateBySlug(
  slug: string,
  options: FindTemplateBySlugOptions = {}
): Promise<ProgrammeTemplateRecord | null> {
  const { tx } = options;

  if (tx) {
    return findTemplateBySlugInTx(tx, slug);
  }

  // No RLS needed — programme_templates is a system-managed lookup table
  const records = await db
    .select()
    .from(programmeTemplates)
    .where(eq(programmeTemplates.slug, slug))
    .limit(1);

  return records[0] ?? null;
}

/** Batch inserts programme_phases rows. RLS context must be set when using a transaction. */
export async function createProgrammePhases(
  organisationId: string,
  phases: NewProgrammePhase[],
  options: CreateProgrammePhasesOptions = {}
): Promise<ProgrammePhaseRecord[]> {
  if (phases.length === 0) {
    return [];
  }

  const { tx } = options;

  if (tx) {
    return createProgrammePhasesInTx(tx, phases);
  }

  return await withRLS(organisationId, undefined, async (newTx) => {
    return createProgrammePhasesInTx(newTx, phases);
  });
}

/**
 * Fetch the user's current programme with programme_phases and template summary.
 * RLS-scoped — returns null if the user has no current programme.
 */
export async function findProgrammeWithPhases(
  organisationId: string,
  userId: string
): Promise<ProgrammeWithPhases | null> {
  return await withRLS(organisationId, userId, async (tx) => {
    const programmeRows = await tx
      .select()
      .from(programmes)
      .where(
        and(
          eq(programmes.organisationId, organisationId),
          eq(programmes.userId, userId),
          isCurrentProgramme
        )
      )
      .orderBy(desc(programmes.createdAt))
      .limit(1);

    if (programmeRows.length === 0) {
      return null;
    }

    const programme = programmeRows[0];

    // Fetch programme phases (user-layer, RLS-scoped)
    const phases = await tx
      .select()
      .from(programmePhases)
      .where(
        and(
          eq(programmePhases.organisationId, organisationId),
          eq(programmePhases.programmeId, programme.id)
        )
      )
      .orderBy(asc(programmePhases.phaseNumber));

    // Fetch template summary (system-managed, but within same transaction for consistency)
    const templateRows = await tx
      .select({
        name: programmeTemplates.name,
        slug: programmeTemplates.slug,
        difficulty: programmeTemplates.difficulty,
      })
      .from(programmeTemplates)
      .where(eq(programmeTemplates.id, programme.programmeTemplateId))
      .limit(1);

    return {
      programme,
      phases,
      template: templateRows[0] ?? null,
    };
  });
}

/**
 * Fetch the full template structure: phases → sessions → exercises → videos.
 * No RLS required — system-managed lookup tables.
 */
export async function findTemplateStructure(
  tx: Transaction,
  templateId: string
): Promise<TemplateStructure> {
  // Fetch all template phases
  const tPhases = await tx
    .select()
    .from(templatePhases)
    .where(eq(templatePhases.programmeTemplateId, templateId))
    .orderBy(asc(templatePhases.phaseNumber));

  if (tPhases.length === 0) {
    return { phases: new Map() };
  }

  const phaseIds = tPhases.map((p) => p.id);

  // Fetch all sessions for these phases
  const tSessions = await tx
    .select()
    .from(templateSessions)
    .where(inArray(templateSessions.templatePhaseId, phaseIds))
    .orderBy(asc(templateSessions.templatePhaseId), asc(templateSessions.sessionNumber));

  const sessionIds = tSessions.map((s) => s.id);

  // Fetch all exercises with video metadata for these sessions
  const exerciseRows =
    sessionIds.length > 0
      ? await tx
          .select({
            exercise: sessionExercises,
            video: {
              id: videos.id,
              title: videos.title,
              durationSeconds: videos.durationSeconds,
              difficulty: videos.difficulty,
            },
          })
          .from(sessionExercises)
          .innerJoin(videos, eq(sessionExercises.videoId, videos.id))
          .where(inArray(sessionExercises.templateSessionId, sessionIds))
          .orderBy(asc(sessionExercises.templateSessionId), asc(sessionExercises.orderIndex))
      : [];

  // Group exercises by session
  const exercisesBySession = new Map<string, ExerciseWithVideo[]>();
  for (const row of exerciseRows) {
    const sessionId = row.exercise.templateSessionId;
    const list = exercisesBySession.get(sessionId) ?? [];
    list.push({ ...row.exercise, video: row.video });
    exercisesBySession.set(sessionId, list);
  }

  // Group sessions by phase
  const sessionsByPhase = new Map<string, TemplateSessionWithExercises[]>();

  for (const session of tSessions) {
    const phaseId = session.templatePhaseId;
    const list = sessionsByPhase.get(phaseId) ?? [];
    list.push({
      session,
      exercises: exercisesBySession.get(session.id) ?? [],
    });
    sessionsByPhase.set(phaseId, list);
  }

  // Build phase map
  const phaseMap = new Map<string, TemplatePhaseWithSessions>();

  for (const phase of tPhases) {
    phaseMap.set(phase.id, {
      phase,
      sessions: sessionsByPhase.get(phase.id) ?? [],
    });
  }

  return { phases: phaseMap };
}

/**
 * Count a programme's progress from the member's own sessions and exercises,
 * in a single RLS transaction.
 */
export async function countProgress(
  organisationId: string,
  userId: string,
  programmeId: string,
  phaseIds: string[],
  currentPhaseId?: string
): Promise<ProgressCounts> {
  return await withRLS(organisationId, userId, async (tx) => {
    // Phase counts (user-layer, RLS-scoped)
    const [totalPhasesResult] = await tx
      .select({ value: count() })
      .from(programmePhases)
      .where(eq(programmePhases.programmeId, programmeId));

    const [completedPhasesResult] = await tx
      .select({ value: count() })
      .from(programmePhases)
      .where(
        and(eq(programmePhases.programmeId, programmeId), eq(programmePhases.status, 'completed'))
      );

    const sessions =
      phaseIds.length > 0
        ? await tx
            .select({
              id: userSessions.id,
              programmePhaseId: userSessions.programmePhaseId,
              status: userSessions.status,
            })
            .from(userSessions)
            .where(
              and(
                eq(userSessions.organisationId, organisationId),
                inArray(userSessions.programmePhaseId, phaseIds)
              )
            )
        : [];

    const sessionIds = sessions.map((s) => s.id);

    const [totalExercisesResult] =
      sessionIds.length > 0
        ? await tx
            .select({ value: count() })
            .from(userSessionExercises)
            .where(
              and(
                eq(userSessionExercises.organisationId, organisationId),
                inArray(userSessionExercises.userSessionId, sessionIds)
              )
            )
        : [{ value: 0 }];

    const [completedExercisesResult] =
      sessionIds.length > 0
        ? await tx
            .select({ value: count() })
            .from(exerciseCompletions)
            .where(
              and(
                eq(exerciseCompletions.organisationId, organisationId),
                inArray(exerciseCompletions.userSessionId, sessionIds),
                eq(exerciseCompletions.completed, true)
              )
            )
        : [{ value: 0 }];

    const currentPhaseSessions = sessions.filter((s) => s.programmePhaseId === currentPhaseId);

    return {
      phases: {
        total: totalPhasesResult.value,
        completed: completedPhasesResult.value,
      },
      sessions: {
        total: sessions.length,
        completed: sessions.filter((s) => s.status === 'completed').length,
        skipped: sessions.filter((s) => s.status === 'skipped').length,
      },
      exercises: {
        total: totalExercisesResult.value,
        completed: completedExercisesResult.value,
      },
      currentPhase: {
        totalSessions: currentPhaseSessions.length,
        completedOrSkippedSessions: currentPhaseSessions.filter(
          (s) => s.status === 'completed' || s.status === 'skipped'
        ).length,
      },
    };
  });
}

export type { CreateProgrammeInput };
export type { ProgrammeTemplateRecord };
export type { TemplatePhaseRecord };
export type { NewProgrammePhase };
export type { ProgrammePhaseRecord };
