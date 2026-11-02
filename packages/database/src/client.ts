/**
 * Database Client Configuration
 *
 * The one connection pool per container, created on first use and reused across
 * invocations. Core's `withRLS` and every service share it.
 *
 * TODO: Phase 2 - Migrate to AWS Secrets Manager for credential management
 * Currently using environment variables for simplicity in Phase 1.
 * See: https://docs.aws.amazon.com/secretsmanager/latest/userguide/intro.html
 *
 * @module database/client
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { createLogger } from './lib/logger';
import { dbTlsConfig } from './lib/tls';
import * as schema from './schema';

const logger = createLogger('db-client');

// A function serves one request at a time: two connections cover a transaction plus one read
// beside it without crowding a small database instance.
const POOL_MAX = 2;

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
export const getDb = (): ReturnType<typeof drizzle> => {
  if (!db) {
    // Validate required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
    const missing = requiredEnvVars.filter((key) => !process.env[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required database environment variables: ${missing.join(', ')}`);
    }

    // Validate DB_PORT is a valid number
    // Not ??, so an empty value also falls back.
    const port = parseInt(process.env.DB_PORT ? process.env.DB_PORT : '5432', 10);

    if (isNaN(port) || port < 1 || port > 65535) {
      throw new Error(
        `Invalid DB_PORT: ${String(process.env.DB_PORT)}. Must be a number between 1 and 65535.`
      );
    }

    const ssl = dbTlsConfig();

    // Log pool creation (useful for CloudWatch debugging)
    logger.info('Creating database connection pool', {
      host: process.env.DB_HOST,
      port,
      database: process.env.DB_NAME,
      max: POOL_MAX,
      tls: ssl ? 'verify' : 'local',
      // Don't log credentials!
    });

    pool = new Pool({
      host: process.env.DB_HOST,
      port,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: POOL_MAX,
      idleTimeoutMillis: 30000,
      // Also bounds the wait for a free client. Under the 20 s function timeout, so an
      // unreachable database or exhausted pool fails as an error rather than a timeout.
      connectionTimeoutMillis: 5000,
      ssl,
    });

    // Handle pool errors to prevent unhandled rejections
    // These are emitted when an idle client in the pool encounters an error
    pool.on('error', (err) => {
      logger.error('Unexpected database pool error', { error: err.message, stack: err.stack });
      // In production, consider sending to CloudWatch/Sentry for alerting
    });

    // Create Drizzle instance with schema
    db = drizzle(pool, { schema });
  }

  return db;
};

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
export const withDb = async <T>(
  callback: (db: ReturnType<typeof drizzle>) => Promise<T>
): Promise<T> => {
  const client = getDb();

  return callback(client);
};

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
export const closeDb = async (): Promise<void> => {
  if (pool) {
    logger.info('Closing database connection pool');
    await pool.end();
    pool = null;
    db = null;
  }
};

// Type exports for external use
export type DbClient = ReturnType<typeof getDb>;

/**
 * Broader type that accepts both DbClient and PgTransaction.
 * Use this for repository functions that may be called within a transaction.
 */
export type DbQueryClient = Pick<
  DbClient,
  'select' | 'insert' | 'update' | 'delete' | 'execute' | 'query'
>;
