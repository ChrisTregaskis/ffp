/**
 * Database Migration Runner
 *
 * This script runs all database migrations including:
 * 1. Drizzle-generated schema migrations
 * 2. RLS policy application
 * 3. Future: Database roles and permissions
 *
 * Environment Variables:
 * - DB_MIGRATE_USER: (Optional) Elevated user for migrations (e.g., root_user)
 * - DB_USER: Fallback if DB_MIGRATE_USER not set
 *
 * IMPORTANT: Database User Roles
 * - root_user (DB_MIGRATE_USER): Runs migrations, creates tables, owns objects.
 *   Has DEFAULT PRIVILEGES configured to grant access to app_user and test_user.
 * - app_user (DB_USER): Application runtime user. Gets permissions via DEFAULT PRIVILEGES.
 * - test_user: Vitest integration tests user (see @ffp/core vitest.config.ts).
 *   Gets permissions via DEFAULT PRIVILEGES. Distinct from app_user.
 *
 * When adding new tables, ensure DEFAULT PRIVILEGES are set so both app_user
 * and test_user automatically receive SELECT, INSERT, UPDATE, DELETE permissions.
 *
 * Usage: pnpm db:migrate
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { applyRLS } from '../src/migrations/apply-rls';
import { applyPermissions } from '../src/migrations/apply-permissions';
import { createLogger } from '../src/lib/logger';

const logger = createLogger('migrate');

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from monorepo root
config({ path: resolve(__dirname, '../../../.env') });

/**
 * Get required environment variable or throw error
 */
const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Main migration runner
 */
const runMigrations = async () => {
  logger.info('Starting database migrations...');

  // Determine which user is running migrations
  const migrationUser = process.env.DB_MIGRATE_USER || getRequiredEnv('DB_USER');

  // Create connection pool
  const pool = new Pool({
    host: getRequiredEnv('DB_HOST'),
    port: parseInt(process.env.DB_PORT || '5432'),
    database: getRequiredEnv('DB_NAME'),
    user: migrationUser,
    password: getRequiredEnv('DB_PASSWORD'),
    // SSL configuration based on environment
    ssl: process.env.ENVIRONMENT === 'development' ? false : { rejectUnauthorized: true },
  });

  const db = drizzle(pool);

  try {
    // Step 1: Run Drizzle schema migrations
    logger.info('Running schema migrations...');
    await migrate(db, { migrationsFolder: resolve(__dirname, '../migrations') });
    logger.info('Schema migrations complete');

    // Step 2: Apply RLS policies
    await applyRLS(db);

    // Step 3: Apply database permissions (DEFAULT PRIVILEGES for app_user and test_user)
    await applyPermissions(db, migrationUser);

    logger.info('All migrations completed successfully!');
  } catch (error) {
    logger.error('Migration failed', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  } finally {
    // Clean up connection pool
    await pool.end();
  }
};

// Run migrations
runMigrations().catch((error) => {
  logger.error('Fatal error during migration', {
    error: error instanceof Error ? error.message : error,
  });
  process.exit(1);
});
