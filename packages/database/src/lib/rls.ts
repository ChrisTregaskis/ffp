/**
 * Row-Level Security (RLS) Utilities
 *
 * Provides helper functions for setting PostgreSQL RLS context variables
 * to enforce multi-tenant data isolation at the database level.
 *
 * @module lib/rls
 */

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Set RLS context variables for multi-tenant isolation
 *
 * Sets the app.tenant_id session variable that RLS policies use to filter queries.
 * Optionally sets app.user_id for user-specific operations.
 *
 * @param db - Drizzle database instance or transaction
 * @param tenantId - Tenant UUID for RLS filtering (required)
 * @param userId - Optional user UUID for user-specific operations
 *
 * @example
 * ```typescript
 * // Set tenant context only
 * await setRLSContext(db, tenantId);
 *
 * // Set both tenant and user context
 * await setRLSContext(db, tenantId, userId);
 * ```
 *
 * @throws {Error} If tenantId is not provided or invalid
 */
export async function setRLSContext(
  db: NodePgDatabase<any>,
  tenantId: string,
  userId?: string
): Promise<void> {
  if (!tenantId) {
    throw new Error('tenantId is required for RLS context');
  }

  // Set tenant_id context variable (required for RLS filtering)
  // Note: SET requires literal values, not parameterised queries
  await db.execute(sql.raw(`SET app.tenant_id = '${tenantId}'`));

  // Optionally set user_id context variable
  if (userId) {
    await db.execute(sql.raw(`SET app.user_id = '${userId}'`));
  }
}

/**
 * Execute a callback within a transaction with RLS context set
 *
 * Wraps the callback in a database transaction and automatically sets
 * the RLS context variables before executing the callback function.
 * This ensures all queries within the callback are properly filtered
 * by the tenant boundary.
 *
 * @param db - Drizzle database instance
 * @param tenantId - Tenant UUID for RLS filtering (required)
 * @param userId - Optional user UUID for user-specific operations
 * @param callback - Function to execute within RLS context
 * @returns Result of callback function
 *
 * @example
 * ```typescript
 * // Query users within tenant context
 * const tenantUsers = await withRLS(db, tenantId, undefined, async (tx) => {
 *   return await tx.query.users.findMany();
 * });
 *
 * // Create a user within tenant and user context
 * const newUser = await withRLS(db, tenantId, userId, async (tx) => {
 *   return await tx.insert(users).values({
 *     email: 'user@example.com',
 *     tenantId: tenantId,
 *     // ... other fields
 *   });
 * });
 * ```
 *
 * @throws {Error} If tenantId is not provided or callback fails
 */
export async function withRLS<T>(
  db: NodePgDatabase<any>,
  tenantId: string,
  userId: string | undefined,
  callback: (tx: NodePgDatabase<any>) => Promise<T>
): Promise<T> {
  if (!tenantId) {
    throw new Error('tenantId is required for RLS context');
  }

  return await db.transaction(async (tx) => {
    // Set RLS context at start of transaction
    await setRLSContext(tx, tenantId, userId);

    // Execute callback with transaction that has RLS context set
    return await callback(tx);
  });
}
