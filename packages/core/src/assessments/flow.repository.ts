import { eq, and } from 'drizzle-orm';

import type { AssessmentFlowRecord } from '@ffp/database';
import { assessmentFlows } from '@ffp/database/schema';

import { db } from '../lib/database';

export type AssessmentFlow = AssessmentFlowRecord;

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
