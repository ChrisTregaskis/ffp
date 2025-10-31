/**
 * Database Client Configuration
 *
 * Implements singleton connection pool optimised for AWS Lambda.
 * The pool is created once and reused across Lambda invocations
 * to minimise connection overhead.
 *
 * @module database/client
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Global connection pool for Lambda reuse
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get database client instance (singleton)
 *
 * Creates a new connection pool on first call, then reuses
 * the same instance for subsequent calls. This is critical
 * for Lambda performance.
 *
 * @returns Drizzle database instance with schema
 */
export function getDb() {
  if (!db) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,

      // Connection pool settings (Lambda optimised)
      max: 10, // Maximum 10 connections per Lambda container
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 30000, // Timeout new connections after 30s

      // SSL/TLS configuration
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false, // Allow self-signed certificates in dev
      } : false,
    });

    // Create Drizzle instance with schema
    db = drizzle(pool, { schema });
  }

  return db;
}

/**
 * Execute callback with database instance
 *
 * Convenience wrapper for Lambda handlers to access database.
 * Ensures connection pool is initialised and provides type-safe
 * database access.
 *
 * @param callback - Async function that receives database instance
 * @returns Promise resolving to callback result
 *
 * @example
 * ```typescript
 * export const handler = async (event: APIGatewayEvent) => {
 *   return withDb(async (db) => {
 *     const users = await db.select().from(usersTable);
 *     return { statusCode: 200, body: JSON.stringify(users) };
 *   });
 * };
 * ```
 */
export async function withDb<T>(
  callback: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> {
  const client = getDb();
  return callback(client);
}

/**
 * Close database connection pool
 *
 * Gracefully shuts down the connection pool. This is primarily
 * for local development and testing. Lambda containers handle
 * cleanup automatically on shutdown.
 *
 * @example
 * ```typescript
 * // In test teardown
 * afterAll(async () => {
 *   await closeDb();
 * });
 * ```
 */
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

// Type exports for external use
export type DbClient = ReturnType<typeof getDb>;
