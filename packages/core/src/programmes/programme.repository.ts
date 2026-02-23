import { eq, and } from 'drizzle-orm';

import {
  programmes,
  programmeTemplates,
  type ProgrammeRecord,
  type ProgrammeTemplateRecord,
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
  userId: string
): Promise<void> {
  await tx
    .update(programmes)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(programmes.id, programmeId), eq(programmes.userId, userId)));
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

/** Archives a programme (sets status to 'archived'). Used when replacing with a new programme. */
export async function archiveProgramme(
  tenantId: string,
  programmeId: string,
  userId: string,
  options: ArchiveProgrammeOptions = {}
): Promise<void> {
  const { tx } = options;

  if (tx) {
    return archiveProgrammeInTx(tx, programmeId, userId);
  }

  await withRLS(tenantId, userId, async (newTx) => {
    return archiveProgrammeInTx(newTx, programmeId, userId);
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

export type { CreateProgrammeInput };
export type { ProgrammeTemplateRecord };
