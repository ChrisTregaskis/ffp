import { eq, and, gt, sql } from 'drizzle-orm';

import type { DbClient, DbQueryClient } from '@ffp/database';
import { assessmentFlows, flowSteps, type FlowStepRecord } from '@ffp/database/schema';

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

/** Insert a step at the given order. Branching fields are left null (never authored here). */
export async function createStep(
  dbClient: DbQueryClient,
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
 * Take the flow's step lock until the transaction ends, and return its active steps, locked
 * too. Every write that adds, removes or reorders a step takes it first, so they take turns.
 * The flow's row is locked before the steps are read, so a writer that waited reads them only
 * once the one before it has committed: a lock on the step rows alone would leave it the rows
 * it first found, without a step the other added, and would lock nothing on a flow with none.
 * `NO KEY UPDATE`, so a member starting an assessment on the flow doesn't wait for it.
 */
export async function lockActiveSteps(
  dbClient: DbQueryClient,
  flowId: string
): Promise<FlowStepRecord[]> {
  await dbClient
    .select({ id: assessmentFlows.id })
    .from(assessmentFlows)
    .where(eq(assessmentFlows.id, flowId))
    .for('no key update');

  return await findStepsByFlowId(dbClient, flowId, { forUpdate: true });
}

/** Point a step's default next step somewhere else, or clear it with null. */
export async function setDefaultNextStep(
  dbClient: DbQueryClient,
  stepId: string,
  defaultNextStepId: string | null
): Promise<void> {
  await dbClient
    .update(flowSteps)
    .set({ defaultNextStepId, updatedAt: new Date() })
    .where(eq(flowSteps.id, stepId));
}

/**
 * Soft-delete a step (`isActive = false`) — kept because
 * `user_assessments.visitedStepIds` references step IDs with no FK.
 */
export async function deactivateStep(dbClient: DbQueryClient, stepId: string): Promise<void> {
  await dbClient
    .update(flowSteps)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(flowSteps.id, stepId));
}

/**
 * Move every active step after `order` down by one, closing the gap a removed step left.
 * Returns how many steps moved.
 */
export async function closeOrderGap(
  dbClient: DbQueryClient,
  flowId: string,
  order: number
): Promise<number> {
  const moved = await dbClient
    .update(flowSteps)
    .set({ order: sql`${flowSteps.order} - 1`, updatedAt: new Date() })
    .where(
      and(eq(flowSteps.flowId, flowId), eq(flowSteps.isActive, true), gt(flowSteps.order, order))
    )
    .returning({ id: flowSteps.id });

  return moved.length;
}

/**
 * Reassign `order` to each step's position in `orderedStepIds` (1-based) and
 * return the flow's active steps in their new order. `order` is not unique, so a
 * straight reassignment is safe (no negative-temp dance). Run it in the transaction
 * that holds the flow's step lock, so a write that fails part-way rolls back.
 */
export async function reorderSteps(
  dbClient: DbQueryClient,
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
