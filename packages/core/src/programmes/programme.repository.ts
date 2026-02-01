import { eq, and } from 'drizzle-orm';

import { programmes, type ProgrammeRecord } from '@ffp/database/schema';

import { withRLS, type Transaction } from '../lib/database';
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

export type { CreateProgrammeInput };
