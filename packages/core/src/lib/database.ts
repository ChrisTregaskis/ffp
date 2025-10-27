/**
 * Database Connection Module
 *
 * Provides connection pooling and RLS utilities for multi-tenant PostgreSQL database.
 * Follows serverless best practices by declaring connections outside handler scope.
 *
 * @module lib/database
 */

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

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
const getSSLConfig = (): boolean | { rejectUnauthorized: boolean; ca: string } => {
  if (process.env.ENVIRONMENT === 'development') {
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
};

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
export const setRLSContext = async (
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  tenantId: string,
  userId?: string
): Promise<void> => {
  await tx.execute(sql`SET LOCAL app.tenant_id = ${tenantId}`);
  if (userId) {
    await tx.execute(sql`SET LOCAL app.user_id = ${userId}`);
  }
};

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
export const withRLS = async <T>(
  tenantId: string,
  userId: string | undefined,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> => {
  return await db.transaction(async (tx) => {
    await setRLSContext(tx, tenantId, userId);
    return await callback(tx);
  });
};

/**
 * Gracefully closes the database connection pool
 * Should be called during application shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

/**
 * Type for tenant context used throughout the application
 */
export interface TenantContext {
  tenantId: string;
  userId?: string;
}
