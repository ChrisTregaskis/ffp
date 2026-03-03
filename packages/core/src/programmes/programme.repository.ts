import { eq, and } from 'drizzle-orm';

import {
  programmes,
  programmeTemplates,
  templatePhases,
  programmePhases,
  type ProgrammeRecord,
  type ProgrammeTemplateRecord,
  type TemplatePhaseRecord,
  type NewProgrammePhase,
} from '@ffp/database/schema';

import { db, withRLS, type Transaction } from '../lib/database';
import { type CreateProgrammeInput } from '../schemas/programme.schema';

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

export interface FindTemplatePhasesOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

export interface CreateProgrammePhasesOptions {
  /** Optional transaction for atomic operations. If provided, RLS must be set by caller. */
  tx?: Transaction;
}

async function createProgrammeInTx(
  tx: Transaction,
  input: CreateProgrammeInput
): Promise<Programme> {
  const [record] = await tx
    .insert(programmes)
    .values({
      tenantId: input.tenantId,
      userId: input.userId,
      programmeTemplateId: input.programmeTemplateId,
      name: input.name,
      description: input.description ?? null,
      totalPhases: input.totalPhases ?? null,
      sessionsPerPhase: input.sessionsPerPhase ?? null,
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
    .where(and(eq(programmes.userId, userId), eq(programmes.status, 'active')))
    .limit(1);

  return records[0] ?? null;
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

async function findTemplatePhasesInTx(
  tx: Transaction,
  templateId: string
): Promise<TemplatePhaseRecord[]> {
  return await tx
    .select()
    .from(templatePhases)
    .where(eq(templatePhases.programmeTemplateId, templateId))
    .orderBy(templatePhases.phaseNumber);
}

async function createProgrammePhasesInTx(
  tx: Transaction,
  phases: NewProgrammePhase[]
): Promise<void> {
  if (phases.length === 0) return;

  await tx.insert(programmePhases).values(phases);
}

export async function createProgramme(
  input: CreateProgrammeInput,
  options: CreateProgrammeOptions = {}
): Promise<Programme> {
  const { tx } = options;

  if (tx) {
    return createProgrammeInTx(tx, input);
  }

  return await withRLS(input.tenantId, input.userId, async (newTx) => {
    return createProgrammeInTx(newTx, input);
  });
}

/** Returns the first active programme for the given user within the tenant. */
export async function findProgrammeByUserId(
  tenantId: string,
  userId: string,
  options: FindByUserIdOptions = {}
): Promise<Programme | null> {
  const { tx } = options;

  if (tx) {
    return findProgrammeByUserIdInTx(tx, userId);
  }

  return await withRLS(tenantId, userId, async (newTx) => {
    return findProgrammeByUserIdInTx(newTx, userId);
  });
}

export async function findProgrammeById(
  tenantId: string,
  programmeId: string,
  options: FindByIdOptions = {}
): Promise<Programme | null> {
  const { userId, tx } = options;

  if (tx) {
    return findProgrammeByIdInTx(tx, programmeId);
  }

  return await withRLS(tenantId, userId, async (newTx) => {
    return findProgrammeByIdInTx(newTx, programmeId);
  });
}

/** Archives a programme — sets status, archivedAt, and optional reason. */
export async function archiveProgramme(
  tenantId: string,
  programmeId: string,
  userId: string,
  options: ArchiveProgrammeOptions = {}
): Promise<void> {
  const { tx, reason } = options;

  if (tx) {
    return archiveProgrammeInTx(tx, programmeId, userId, reason);
  }

  await withRLS(tenantId, userId, async (newTx) => {
    return archiveProgrammeInTx(newTx, programmeId, userId, reason);
  });
}

/** Links an archived programme to its replacement (sets replacedByProgrammeId). */
export async function setReplacementProgramme(
  tenantId: string,
  archivedProgrammeId: string,
  replacementProgrammeId: string,
  options: SetReplacementProgrammeOptions = {}
): Promise<void> {
  const { tx } = options;

  if (tx) {
    return setReplacementProgrammeInTx(tx, archivedProgrammeId, replacementProgrammeId);
  }

  await withRLS(tenantId, undefined, async (newTx) => {
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

/** Retrieves template phases for a programme template, ordered by phase_number. No RLS required. */
export async function findTemplatePhases(
  templateId: string,
  options: FindTemplatePhasesOptions = {}
): Promise<TemplatePhaseRecord[]> {
  const { tx } = options;

  if (tx) {
    return findTemplatePhasesInTx(tx, templateId);
  }

  // No RLS needed — template_phases is a system-managed lookup table
  return await db
    .select()
    .from(templatePhases)
    .where(eq(templatePhases.programmeTemplateId, templateId))
    .orderBy(templatePhases.phaseNumber);
}

/** Batch inserts programme_phases rows. RLS context must be set when using a transaction. */
export async function createProgrammePhases(
  tenantId: string,
  phases: NewProgrammePhase[],
  options: CreateProgrammePhasesOptions = {}
): Promise<void> {
  if (phases.length === 0) return;

  const { tx } = options;

  if (tx) {
    return createProgrammePhasesInTx(tx, phases);
  }

  await withRLS(tenantId, undefined, async (newTx) => {
    return createProgrammePhasesInTx(newTx, phases);
  });
}

export type { CreateProgrammeInput };
export type { ProgrammeTemplateRecord };
export type { TemplatePhaseRecord };
export type { NewProgrammePhase };
