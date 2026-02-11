import { eq, and, asc } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import {
  assessmentFlows,
  flowSteps,
  type AssessmentFlowRecord,
  type FlowStepRecord,
} from '@ffp/database/schema';

import { db } from '../lib/database';

export type AssessmentFlow = AssessmentFlowRecord;
export type FlowStepWithConfig = FlowStepRecord;

export async function findById(flowId: string): Promise<AssessmentFlow | null> {
  const records = await db
    .select()
    .from(assessmentFlows)
    .where(eq(assessmentFlows.id, flowId))
    .limit(1);

  if (records.length === 0) {
    return null;
  }

  return records[0];
}

/**
 * Find an assessment flow by ID
 *
 * Accepts a database client for use within RLS transactions.
 * Returns flow with scoringConfig for scoring operations.
 *
 * @param dbClient - Database client (transaction or connection)
 * @param flowId - The assessment flow UUID
 */
export async function findFlowById(
  dbClient: DbClient,
  flowId: string
): Promise<AssessmentFlow | null> {
  const records = await dbClient
    .select()
    .from(assessmentFlows)
    .where(eq(assessmentFlows.id, flowId))
    .limit(1);

  if (records.length === 0) {
    return null;
  }

  return records[0];
}

/**
 * Find an active assessment flow by ID
 *
 * Combines existence and active status check in a single query.
 * Returns null if flow doesn't exist OR if it exists but is inactive.
 */
export async function findActiveById(flowId: string): Promise<AssessmentFlow | null> {
  const records = await db
    .select()
    .from(assessmentFlows)
    .where(and(eq(assessmentFlows.id, flowId), eq(assessmentFlows.isActive, true)))
    .limit(1);

  if (records.length === 0) {
    return null;
  }

  return records[0];
}

/**
 * Find the first active assessment flow
 *
 * Returns any single active flow. Used to determine the default
 * assessment flow for users who have not yet been assigned one.
 * No RLS needed — assessment_flows is a system-managed table.
 */
export async function findFirstActive(): Promise<AssessmentFlow | null> {
  const records = await db
    .select()
    .from(assessmentFlows)
    .where(eq(assessmentFlows.isActive, true))
    .limit(1);

  return records[0] ?? null;
}

/**
 * Find all steps for a flow from the normalised flow_steps table
 *
 * Returns steps ordered by `order` (tier/level), then by id for deterministic
 * ordering of parallel branches at the same tier.
 *
 * @param dbClient - Database client (transaction or connection)
 * @param flowId - The assessment flow UUID
 * @returns Array of flow steps, ordered by tier then by id
 */
export async function findStepsByFlowId(
  dbClient: DbClient,
  flowId: string
): Promise<FlowStepWithConfig[]> {
  const records = await dbClient
    .select()
    .from(flowSteps)
    .where(and(eq(flowSteps.flowId, flowId), eq(flowSteps.isActive, true)))
    .orderBy(asc(flowSteps.order), asc(flowSteps.id));

  return records;
}
