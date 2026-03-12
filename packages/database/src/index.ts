/**
 * Database Package
 *
 * Provides database schemas, utilities, and types for the FFP application.
 * @module @ffp/database
 */

// Re-export all schemas
export * from './schema';

// Re-export constants (job statuses, job types, etc.)
export * from './constants';

// Re-export shared types (JSONB column types)
export * from './types';

// Re-export RLS utilities
export * from './lib/rls';

// Re-export logger utilities
export { createLogger, DatabaseLogLevel } from './lib/logger';
export type { LogContext, DatabaseLogger } from './lib/logger';

// Re-export database client
export { getDb, withDb, closeDb } from './client';
export type { DbClient, DbQueryClient } from './client';
