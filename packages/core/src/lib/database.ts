import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { setRLSContext as setRLSContextBase } from '@ffp/database';

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
 * Transaction type for use in repository functions
 *
 * Use this type when passing transactions between functions to ensure
 * atomic operations across multiple database writes.
 */
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Sets the Row-Level Security (RLS) context for the current transaction
 *
 * Delegates to @ffp/database's canonical implementation for UUID validation,
 * SQL escaping, and SET LOCAL execution.
 *
 * @param tx - Database transaction instance
 * @param organisationId - UUID of the organisation
 * @param userId - Optional UUID of the user
 */
export async function setRLSContext(
  tx: Transaction,
  organisationId: string,
  userId?: string
): Promise<void> {
  await setRLSContextBase(tx, organisationId, userId);
}

/**
 * Transaction wrapper that automatically sets RLS context
 *
 * This is the recommended way to perform database operations in the application.
 * It ensures that all queries within the transaction are scoped to the organisation.
 *
 * @param organisationId - UUID of the organisation
 * @param userId - Optional UUID of the user
 * @param callback - Async function to execute within the transaction
 * @returns Result of the callback function
 */
export async function withRLS<T>(
  organisationId: string,
  userId: string | undefined,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    await setRLSContext(tx, organisationId, userId);

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
