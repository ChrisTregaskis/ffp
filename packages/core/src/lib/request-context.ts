import { getDb, type DbClient } from '@ffp/database';

import type { TenantContext } from './context';

export interface RequestContext {
  /** Database client for executing queries and transactions */
  db: DbClient;

  /** Tenant ID for Row-Level Security isolation */
  tenantId: string;

  /** Customer ID within the tenant (nullable for super admins) */
  customerId: string | null;

  /** User ID if the actor is a user (undefined for system actors) */
  userId?: string;

  /** User role if the actor is a user (undefined for system actors) */
  role?: string;

  /** Unique request ID for tracing and logging */
  requestId: string;

  /** Timestamp when the context was created */
  timestamp: Date;

  /** Full tenant context (includes actor and other metadata) */
  tenantContext: TenantContext;
}

/**
 * Create a request context from tenant context
 *
 * This helper function should be called at the handler level to create
 * a unified context object that can be passed to services. It automatically
 * retrieves the database client using getDb().
 *
 * @param tenantContext - Tenant context extracted from JWT or job message
 * @returns RequestContext with all necessary information for services
 *
 * @example
 * ```typescript
 * export const handler = async (event: APIGatewayProxyEvent) => {
 *   const tenantContext = extractUserContext(event);
 *   const ctx = createRequestContext(tenantContext);
 *
 *   // Pass single context object to service
 *   const result = await someService(ctx, data);
 *   return success(result);
 * };
 * ```
 */
export function createRequestContext(tenantContext: TenantContext): RequestContext {
  try {
    return {
      db: getDb(),
      tenantId: tenantContext.tenantId,
      customerId: tenantContext.customerId,
      userId: tenantContext.actor.type === 'user' ? tenantContext.actor.userId : undefined,
      role: tenantContext.actor.type === 'user' ? tenantContext.actor.userRole : undefined,
      requestId: tenantContext.requestId,
      timestamp: tenantContext.timestamp,
      tenantContext,
    };
  } catch (error) {
    throw new Error(
      `Failed to create request context: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
