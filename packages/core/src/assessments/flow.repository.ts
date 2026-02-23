import { eq, and, asc } from 'drizzle-orm';

import type { DbClient } from '@ffp/database';
import {
  assessmentFlows,
  flowSteps,
  tenants,
  type AssessmentFlowRecord,
  type FlowStepRecord,
} from '@ffp/database/schema';

import { db, withRLS } from '../lib/database';
import { InternalServerError } from '../lib/errors';
import { createSystemLogger } from '../lib/logger';

const logger = createSystemLogger('flow-repository');

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
 * Extract `defaultAssessmentFlowId` from a tenant settings JSONB value.
 * Returns the flow ID string if present, otherwise null.
 */
function extractDefaultFlowId(settings: unknown): string | null {
  if (typeof settings === 'object' && settings !== null) {
    const obj = settings as Record<string, unknown>;
    if (typeof obj.defaultAssessmentFlowId === 'string') {
      return obj.defaultAssessmentFlowId;
    }
  }

  return null;
}

/**
 * Find the default assessment flow for a tenant
 *
 * Lookup hierarchy:
 * 1. Tenant's own `settings.defaultAssessmentFlowId` — per-tenant override
 * 2. Platform tenant's `settings.defaultAssessmentFlowId` — global default (required)
 *
 * At each level, the configured flow is validated as still active.
 * This allows customer admins to set a tenant-specific default, while
 * platform admins control the global default for all tenants.
 *
 * @param tenantId - The tenant UUID to check settings for
 * @throws InternalServerError if no default assessment flow is configured
 */
export async function findDefaultForTenant(tenantId: string): Promise<AssessmentFlow | null> {
  // Check tenant's own settings for a configured default
  const tenantFlowId = await withRLS(tenantId, undefined, async (tx) => {
    const records = await tx
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    return extractDefaultFlowId(records[0]?.settings);
  });

  if (tenantFlowId) {
    const flow = await findActiveById(tenantFlowId);

    if (flow) {
      return flow;
    }
  }

  // Check platform tenant settings for a global default
  // Uses the user's tenant RLS context — the tenant_isolation policy allows
  // any tenant to also read the platform tenant row (type = 'platform')
  const platformFlowId = await withRLS(tenantId, undefined, async (tx) => {
    const records = await tx
      .select({ settings: tenants.settings })
      .from(tenants)
      .where(eq(tenants.type, 'platform'))
      .limit(1);

    return extractDefaultFlowId(records[0]?.settings);
  });

  if (platformFlowId) {
    const flow = await findActiveById(platformFlowId);

    if (flow) {
      return flow;
    }

    // Configured flow ID exists but is inactive or missing
    logger.error('Platform default assessment flow is not active or does not exist', {
      platformFlowId,
      tenantId,
    });

    throw new InternalServerError(
      'Platform default assessment flow is not active or does not exist.'
    );
  }

  // Fallback — find any single active flow
  const fallbackRecords = await db
    .select()
    .from(assessmentFlows)
    .where(eq(assessmentFlows.isActive, true))
    .limit(1);

  if (fallbackRecords[0]) {
    logger.warn('No default assessment flow configured — falling back to first active flow', {
      tenantId,
      flowId: fallbackRecords[0].id,
    });

    return fallbackRecords[0];
  }

  // No flows exist at all
  logger.error('No default assessment flow configured', { tenantId });

  throw new InternalServerError('No default assessment flow is configured.');
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
