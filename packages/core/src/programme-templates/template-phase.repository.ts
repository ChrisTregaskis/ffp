import { count, eq, max } from 'drizzle-orm';

import type { DbQueryClient } from '@ffp/database';
import { programmePhases, templatePhases, type TemplatePhaseRecord } from '@ffp/database/schema';

import type { CreatePhaseRequest, UpdatePhaseRequest } from '../schemas/programme/programme.schema';

/** Returns all phases for a template, ordered by phaseNumber. */
export async function findPhasesByTemplateId(
  db: DbQueryClient,
  templateId: string
): Promise<TemplatePhaseRecord[]> {
  return await db
    .select()
    .from(templatePhases)
    .where(eq(templatePhases.programmeTemplateId, templateId))
    .orderBy(templatePhases.phaseNumber);
}

/** Returns a single phase by ID, or null if not found. */
export async function findPhaseById(
  db: DbQueryClient,
  id: string
): Promise<TemplatePhaseRecord | null> {
  const records = await db.select().from(templatePhases).where(eq(templatePhases.id, id)).limit(1);

  return records[0] ?? null;
}

/** Counts how many user programme phases reference a given template phase. */
export async function countProgrammePhasesByTemplatePhaseId(
  db: DbQueryClient,
  templatePhaseId: string
): Promise<number> {
  const [result] = await db
    .select({ total: count() })
    .from(programmePhases)
    .where(eq(programmePhases.templatePhaseId, templatePhaseId));

  return result.total;
}

/**
 * Inserts a new phase for a template.
 * Auto-assigns phaseNumber as max(existing) + 1.
 */
export async function insertPhase(
  db: DbQueryClient,
  templateId: string,
  input: CreatePhaseRequest
): Promise<TemplatePhaseRecord> {
  // Determine next phaseNumber
  const [result] = await db
    .select({ maxPhaseNumber: max(templatePhases.phaseNumber) })
    .from(templatePhases)
    .where(eq(templatePhases.programmeTemplateId, templateId));

  const nextPhaseNumber = (result.maxPhaseNumber ?? 0) + 1;

  const records = await db
    .insert(templatePhases)
    .values({
      programmeTemplateId: templateId,
      phaseNumber: nextPhaseNumber,
      name: input.name ?? null,
      description: input.description ?? null,
    })
    .returning();

  return records[0];
}

/** Updates a phase and returns the updated record, or null if not found. */
export async function updatePhase(
  db: DbQueryClient,
  id: string,
  data: UpdatePhaseRequest
): Promise<TemplatePhaseRecord | null> {
  const records = await db
    .update(templatePhases)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(templatePhases.id, id))
    .returning();

  return records[0] ?? null;
}

/** Updates a phase's sessionCount. Used by session service to sync parent metadata. */
export async function updateSessionCount(
  db: DbQueryClient,
  phaseId: string,
  sessionCount: number
): Promise<void> {
  await db
    .update(templatePhases)
    .set({ sessionCount, updatedAt: new Date() })
    .where(eq(templatePhases.id, phaseId));
}

/** Deletes a phase by ID. Returns true if a row was deleted. DB cascade handles children. */
export async function deletePhase(db: DbQueryClient, id: string): Promise<boolean> {
  const result = await db.delete(templatePhases).where(eq(templatePhases.id, id)).returning();

  return result.length > 0;
}

/**
 * Reorders phases for a template by updating phaseNumber to match
 * the position in the orderedIds array (1-based).
 *
 * Temporarily sets phaseNumber to negative values to avoid unique constraint
 * violations during reorder, then updates to final positions.
 */
export async function reorderPhases(
  db: DbQueryClient,
  templateId: string,
  orderedIds: string[]
): Promise<TemplatePhaseRecord[]> {
  // Set temporary negative values to avoid unique constraint conflicts
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(templatePhases)
      .set({ phaseNumber: -(i + 1), updatedAt: new Date() })
      .where(eq(templatePhases.id, orderedIds[i]));
  }

  // Set final positive values
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(templatePhases)
      .set({ phaseNumber: i + 1, updatedAt: new Date() })
      .where(eq(templatePhases.id, orderedIds[i]));
  }

  // Return phases in new order
  return await findPhasesByTemplateId(db, templateId);
}

/**
 * Re-numbers phases for a template to maintain a contiguous sequence.
 * Used after a phase is deleted to close gaps in phaseNumber.
 */
export async function renumberPhases(db: DbQueryClient, templateId: string): Promise<void> {
  const phases = await findPhasesByTemplateId(db, templateId);

  for (let i = 0; i < phases.length; i++) {
    const expectedNumber = i + 1;

    if (phases[i].phaseNumber !== expectedNumber) {
      await db
        .update(templatePhases)
        .set({ phaseNumber: expectedNumber, updatedAt: new Date() })
        .where(eq(templatePhases.id, phases[i].id));
    }
  }
}
