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
 * Strict UUID validation regex (RFC 4122 compliant)
 * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * Where x is a hexadecimal digit (0-9, a-f, A-F)
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a properly formatted UUID
 * This is used to prevent SQL injection when setting RLS context
 *
 * @param value - String to validate
 * @param paramName - Parameter name for error messages
 * @throws {Error} If value is not a valid UUID format
 */
const validateUUID = (value: string, paramName: string): void => {
  if (!UUID_REGEX.test(value)) {
    throw new Error(`${paramName} must be a valid UUID format (got: ${value.substring(0, 20)}...)`);
  }
};

/**
 * Safely escape a string literal for use in SQL
 * PostgreSQL's SET command requires literal values and doesn't support parameterised queries.
 * This function escapes single quotes by doubling them (PostgreSQL standard).
 *
 * @param value - String to escape
 * @returns Safely escaped string value
 */
const escapeLiteral = (value: string): string => {
  return value.replace(/'/g, "''");
};

/**
 * Set RLS context variables for multi-tenant isolation
 *
 * Sets the app.organisation_id session variable that RLS policies use to filter queries.
 * Optionally sets app.user_id for user-specific operations.
 *
 * @param db - Drizzle database instance or transaction
 * @param organisationId - Organisation UUID for RLS filtering (required)
 * @param userId - Optional user UUID for user-specific operations
 *
 * @example
 * ```typescript
 * // Set organisation context only
 * await setRLSContext(db, organisationId);
 *
 * // Set both organisation and user context
 * await setRLSContext(db, organisationId, userId);
 * ```
 *
 * @throws {Error} If organisationId is not provided or invalid
 */
export const setRLSContext = async (
  db: NodePgDatabase<any>,
  organisationId: string,
  userId?: string
): Promise<void> => {
  if (!organisationId) {
    throw new Error('organisationId is required for RLS context');
  }

  // Validate UUID format to prevent SQL injection
  validateUUID(organisationId, 'organisationId');

  // Set organisation_id context variable (required for RLS filtering)
  // Note: PostgreSQL's SET command doesn't support parameterised queries ($1, $2, etc.)
  // We use sql.raw() with multiple layers of defence:
  // 1. UUID format validation (only allows hexadecimal digits and hyphens)
  // 2. SQL escaping (escape single quotes using PostgreSQL standard)
  const escapedOrganisationId = escapeLiteral(organisationId);
  await db.execute(sql.raw(`SET app.organisation_id = '${escapedOrganisationId}'`));

  // Optionally set user_id context variable
  if (userId) {
    validateUUID(userId, 'userId');
    const escapedUserId = escapeLiteral(userId);
    await db.execute(sql.raw(`SET app.user_id = '${escapedUserId}'`));
  }
};

/**
 * Execute a callback within a transaction with RLS context set
 *
 * Wraps the callback in a database transaction and automatically sets
 * the RLS context variables before executing the callback function.
 * This ensures all queries within the callback are properly filtered
 * by the organisation boundary.
 *
 * @param db - Drizzle database instance
 * @param organisationId - Organisation UUID for RLS filtering (required)
 * @param userId - Optional user UUID for user-specific operations
 * @param callback - Function to execute within RLS context
 * @returns Result of callback function
 *
 * @example
 * ```typescript
 * // Query users within organisation context
 * const orgUsers = await withRLS(db, organisationId, undefined, async (tx) => {
 *   return await tx.query.users.findMany();
 * });
 *
 * // Create a user within organisation and user context
 * const newUser = await withRLS(db, organisationId, userId, async (tx) => {
 *   return await tx.insert(users).values({
 *     email: 'user@example.com',
 *     organisationId: organisationId,
 *     // ... other fields
 *   });
 * });
 * ```
 *
 * @throws {Error} If organisationId is not provided or callback fails
 */
export const withRLS = async <T>(
  db: NodePgDatabase<any>,
  organisationId: string,
  userId: string | undefined,
  callback: (tx: NodePgDatabase<any>) => Promise<T>
): Promise<T> => {
  if (!organisationId) {
    throw new Error('organisationId is required for RLS context');
  }

  // Validate UUID formats early (defence in depth)
  validateUUID(organisationId, 'organisationId');
  if (userId) {
    validateUUID(userId, 'userId');
  }

  return await db.transaction(async (tx) => {
    // Set RLS context at start of transaction
    await setRLSContext(tx, organisationId, userId);

    // Execute callback with transaction that has RLS context set
    return await callback(tx);
  });
};

/**
 * Set admin context to bypass organisation-scoped RLS policies
 *
 * Sets `app.is_admin = 'true'` which activates the `admin_bypass` permissive
 * policies on locations and users tables. This allows system_admin queries
 * to operate cross-organisation without disabling RLS entirely.
 *
 * Must be called within a transaction. The setting is automatically cleared
 * when the transaction ends.
 *
 * @param tx - Drizzle transaction instance
 *
 * @example
 * ```typescript
 * const locations = await db.transaction(async (tx) => {
 *   await setAdminContext(tx);
 *   return await tx.select().from(locations);
 * });
 * ```
 */
export const setAdminContext = async (tx: NodePgDatabase<any>): Promise<void> => {
  await tx.execute(sql.raw(`SET LOCAL app.is_admin = 'true'`));
};

/**
 * Execute a callback within a transaction with admin bypass context
 *
 * Convenience wrapper that sets `app.is_admin = 'true'` and executes
 * the callback. All queries within the callback will bypass organisation
 * isolation on tables with admin_bypass policies (locations, users).
 *
 * @param db - Drizzle database instance
 * @param callback - Function to execute within admin context
 * @returns Result of callback function
 *
 * @example
 * ```typescript
 * const allLocations = await withAdminContext(db, async (tx) => {
 *   return await tx.select().from(locations);
 * });
 * ```
 */
export const withAdminContext = async <TDb extends NodePgDatabase<any>, T>(
  db: TDb,
  callback: (tx: TDb) => Promise<T>
): Promise<T> => {
  return await db.transaction(async (tx) => {
    await setAdminContext(tx);
    return await callback(tx as unknown as TDb);
  });
};
