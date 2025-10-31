/**
 * Database Client Configuration
 *
 * Implements singleton connection pool optimised for AWS Lambda.
 * The pool is created once and reused across Lambda invocations
 * to minimise connection overhead.
 *
 * TODO: Phase 2 - Migrate to AWS Secrets Manager for credential management
 * Currently using environment variables for simplicity in Phase 1.
 * See: https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html
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
 * @throws {Error} If required environment variables are missing or invalid
 */
export function getDb() {
  if (!db) {
    // Validate required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missing = requiredEnvVars.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
    }

    // Validate DB_PORT is a valid number
    const port = parseInt(process.env.DB_PORT || '5432', 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(
        `Invalid DB_PORT: ${process.env.DB_PORT}. Must be a number between 1 and 65535.`
      );
    }

    // Determine SSL configuration based on environment
    const sslEnabled = process.env.DB_SSL === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    // Log pool creation (useful for CloudWatch debugging)
    console.log('Creating database connection pool', {
      host: process.env.DB_HOST,
      port,
      database: process.env.DB_NAME,
      max: 10,
      ssl: sslEnabled,
      sslRejectUnauthorized: isProduction,
      // Don't log credentials!
    });

    pool = new Pool({
      host: process.env.DB_HOST,
      port,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,

      // Connection pool settings (Lambda optimised)
      max: 10, // Maximum 10 connections per Lambda container
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 30000, // Timeout new connections after 30s

      // SSL/TLS configuration
      // SECURITY: In production, always verify certificates to prevent MITM attacks
      // In development, allow self-signed certificates for local PostgreSQL
      ssl: sslEnabled
        ? {
            rejectUnauthorized: isProduction,
          }
        : false,
    });

    // Handle pool errors to prevent unhandled rejections
    // These are emitted when an idle client in the pool encounters an error
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
      // In production, consider sending to CloudWatch/Sentry for alerting
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
    console.log('Closing database connection pool');
    await pool.end();
    pool = null;
    db = null;
  }
}

// Type exports for external use
export type DbClient = ReturnType<typeof getDb>;
