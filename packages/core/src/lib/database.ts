import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

/**
 * Strict UUID validation regex (RFC 4122 compliant)
 * Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a properly formatted UUID
 * This prevents SQL injection when setting RLS context
 */
function validateUUID(value: string, paramName: string): void {
  if (!value) {
    throw new Error(`${paramName} is required for RLS context`);
  }
  if (!UUID_REGEX.test(value)) {
    throw new Error(`${paramName} must be a valid UUID format (got: ${value.substring(0, 20)}...)`);
  }
}

/**
 * Safely escape a string literal for use in SQL
 * PostgreSQL's SET command requires literal values and doesn't support parameterised queries.
 */
function escapeLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Gets SSL configuration based on environment
 *
 * Development: SSL disabled (local PostgreSQL)
 * Staging/Production: SSL enabled with AWS RDS CA certificate for explicit validation
 *
 * Note: Uses dynamic imports for Node.js modules (fs, path) to avoid bundling issues
 * with browser-based build tools (Vite).
 *
 * @returns SSL configuration for pg Pool
 */
function getSSLConfig(): boolean | { rejectUnauthorized: boolean; ca: string } {
  // SST uses stage names like 'dev', personal stages, 'staging', 'production'
  // Only enable SSL for staging and production
  const stage = process.env.SST_STAGE ?? process.env.ENVIRONMENT;
  if (stage !== 'staging' && stage !== 'production') {
    return false;
  }

  // Dynamic import of Node.js modules to prevent Vite from trying to bundle them
  // We use require() instead of import to avoid Vite bundling Node.js modules for browser
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs') as { readFileSync: (path: string, encoding: string) => string };
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path') as { join: (...paths: string[]) => string };

  // Load AWS RDS CA certificate bundle for staging/production
  // This ensures we're connecting to a legitimate AWS RDS instance
  const caPath = path.join(__dirname, '../../certs/rds-ca-bundle.pem');
  return {
    rejectUnauthorized: true,
    ca: fs.readFileSync(caPath, 'utf-8'),
  };
}

/**
 * Connection pool for PostgreSQL
 * Declared at module scope for Lambda connection reuse
 * Max 10 connections for Lambda optimisation
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: getSSLConfig(),
  max: 10, // Lambda-optimised connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Drizzle ORM instance
 * Reused across Lambda invocations for performance
 */
export const db = drizzle({ client: pool });

/**
 * Sets the Row-Level Security (RLS) context for the current transaction
 *
 * This function sets PostgreSQL session variables that are used by RLS policies
 * to enforce multi-tenant data isolation.
 *
 * Note: PostgreSQL's SET command doesn't support parameterised queries ($1, $2, etc.)
 * We use sql.raw() with multiple layers of defence:
 * 1. UUID format validation (only allows hexadecimal digits and hyphens)
 * 2. SQL escaping (escape single quotes using PostgreSQL standard)
 *
 * @param tx - Database transaction instance
 * @param tenantId - UUID of the tenant
 * @param userId - Optional UUID of the user
 *
 * @example
 * ```typescript
 * await db.transaction(async (tx) => {
 *   await setRLSContext(tx, tenantId, userId);
 *   return await tx.query.users.findMany();
 * });
 * ```
 */
export async function setRLSContext(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  userId?: string
): Promise<void> {
  validateUUID(tenantId, 'tenantId');
  const escapedTenantId = escapeLiteral(tenantId);
  await tx.execute(sql.raw(`SET LOCAL app.tenant_id = '${escapedTenantId}'`));

  if (userId) {
    validateUUID(userId, 'userId');
    const escapedUserId = escapeLiteral(userId);
    await tx.execute(sql.raw(`SET LOCAL app.user_id = '${escapedUserId}'`));
  }
}

/**
 * Transaction wrapper that automatically sets RLS context
 *
 * This is the recommended way to perform database operations in the application.
 * It ensures that all queries within the transaction are scoped to the tenant.
 *
 * @param tenantId - UUID of the tenant
 * @param userId - Optional UUID of the user
 * @param callback - Async function to execute within the transaction
 * @returns Result of the callback function
 *
 * @example
 * ```typescript
 * const users = await withRLS(tenantId, userId, async (tx) => {
 *   return await tx.query.users.findMany();
 * });
 * ```
 */
export async function withRLS<T>(
  tenantId: string,
  userId: string | undefined,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    await setRLSContext(tx, tenantId, userId);
    return await callback(tx);
  });
}

/**
 * Gracefully closes the database connection pool
 * Should be called during application shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
