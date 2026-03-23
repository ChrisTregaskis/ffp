import { getDb, type DbClient } from '@ffp/database';

import type { OrganisationContext } from './context';

export interface RequestContext {
  /** Database client for executing queries and transactions */
  db: DbClient;

  /** Organisation ID for Row-Level Security isolation */
  organisationId: string;

  /** Location ID within the organisation (nullable for super admins) */
  locationId: string | null;

  /** User ID if the actor is a user (undefined for system actors) */
  userId?: string;

  /** User role if the actor is a user (undefined for system actors) */
  role?: string;

  /** Unique request ID for tracing and logging */
  requestId: string;

  /** Timestamp when the context was created */
  timestamp: Date;

  /** Full organisation context (includes actor and other metadata) */
  organisationContext: OrganisationContext;
}

/**
 * Create a request context from organisation context
 *
 * This helper function should be called at the handler level to create
 * a unified context object that can be passed to services. It automatically
 * retrieves the database client using getDb().
 *
 * @param organisationContext - Organisation context extracted from JWT or job message
 * @returns RequestContext with all necessary information for services
 */
export function createRequestContext(organisationContext: OrganisationContext): RequestContext {
  try {
    return {
      db: getDb(),
      organisationId: organisationContext.organisationId,
      locationId: organisationContext.locationId,
      userId:
        organisationContext.actor.type === 'user' ? organisationContext.actor.userId : undefined,
      role:
        organisationContext.actor.type === 'user' ? organisationContext.actor.userRole : undefined,
      requestId: organisationContext.requestId,
      timestamp: organisationContext.timestamp,
      organisationContext,
    };
  } catch (error) {
    throw new Error(
      `Failed to create request context: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
