import { eq, and, max } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import { flowSteps, type FlowStepRecord } from '@ffp/database/schema';

import { findStepsByFlowId } from './flow.repository';

import type { CreateFlowStepInput, UpdateFlowStepInput } from '../schemas/assessment-flow.schema';

/**
 * Writes for `flow_steps`. RLS-excluded catalogue, so a plain `DbClient` with no
 * RLS context (mirrors `flow.repository`); active-only reads live there.
 */

/** Find a single flow step by its public identifier, or null if not found. */
export async function findStepByPublicId(
  dbClient: DbClient,
  publicId: string
): Promise<FlowStepRecord | null> {
  const records = await dbClient
    .select()
    .from(flowSteps)
    .where(eq(flowSteps.publicId, publicId))
    .limit(1);

  return records[0] ?? null;
}

/** Highest `order` among a flow's active steps, or 0 when none (new steps append at max + 1). */
export async function findMaxOrderForFlow(dbClient: DbClient, flowId: string): Promise<number> {
  const [result] = await dbClient
    .select({ maxOrder: max(flowSteps.order) })
    .from(flowSteps)
    .where(and(eq(flowSteps.flowId, flowId), eq(flowSteps.isActive, true)));

  return result.maxOrder ?? 0;
}

/** Insert a step at the given order. Branching fields are left null (never authored here). */
export async function createStep(
  dbClient: DbClient,
  flowId: string,
  order: number,
  input: CreateFlowStepInput
): Promise<FlowStepRecord> {
  const [record] = await dbClient
    .insert(flowSteps)
    .values({
      flowId,
      order,
      type: input.type,
      templateId: input.templateId ?? null,
      config: input.config,
    })
    .returning();

  return record;
}

/**
 * Update a step's type, template link and/or config. Columns are mapped
 * explicitly so branching fields stay un-authorable structurally, not just by
 * schema omission. Returns null if the step does not exist.
 */
export async function updateStep(
  dbClient: DbClient,
  stepId: string,
  data: UpdateFlowStepInput
): Promise<FlowStepRecord | null> {
  const records = await dbClient
    .update(flowSteps)
    .set({
      ...(data.type !== undefined && { type: data.type }),
      ...(data.templateId !== undefined && { templateId: data.templateId }),
      ...(data.config !== undefined && { config: data.config }),
      updatedAt: new Date(),
    })
    .where(eq(flowSteps.id, stepId))
    .returning();

  return records[0] ?? null;
}

/**
 * Soft-delete a step (`isActive = false`) — kept because
 * `user_assessments.visitedStepIds` references step IDs with no FK. No renumber.
 */
export async function deactivateStep(dbClient: DbClient, stepId: string): Promise<void> {
  await dbClient
    .update(flowSteps)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(flowSteps.id, stepId));
}

/**
 * Reassign `order` to each step's position in `orderedStepIds` (1-based) and
 * return the flow's active steps in their new order. `order` is not unique, so a
 * straight reassignment is safe (no negative-temp dance). Intentionally not
 * transactional: a partial write self-heals on the next reorder, and `tx` is not
 * assignable to this module's `DbClient` signatures.
 */
export async function reorderSteps(
  dbClient: DbClient,
  flowId: string,
  orderedStepIds: string[]
): Promise<FlowStepRecord[]> {
  for (let i = 0; i < orderedStepIds.length; i++) {
    await dbClient
      .update(flowSteps)
      .set({ order: i + 1, updatedAt: new Date() })
      .where(eq(flowSteps.id, orderedStepIds[i]));
  }

  return await findStepsByFlowId(dbClient, flowId);
}
