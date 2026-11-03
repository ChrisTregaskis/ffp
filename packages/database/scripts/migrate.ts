/**
 * Applies the Drizzle schema migrations, then RLS policies, then the application roles'
 * grants (`pnpm db:migrate`). The roles must already exist: on a new server, create them
 * first with `create-roles.ts`.
 *
 * Connects as DB_MIGRATE_USER / DB_MIGRATE_PASSWORD, the role that owns the schema objects.
 * DB_USER is the runtime role that receives row access; DB_TEST_USER optionally names a
 * test role to receive the same, and is refused on a deployed ENVIRONMENT.
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import { requiredEnv } from '../src/lib/env';
import { createLogger } from '../src/lib/logger';
import { dbTlsConfig } from '../src/lib/tls';
import { applyPermissions, resolveGrantees } from '../src/migrations/apply-permissions';
import { applyRLS } from '../src/migrations/apply-rls';
import { migrationCredentials } from '../src/migrations/migration-credentials';

const logger = createLogger('migrate');

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from monorepo root
config({ path: resolve(__dirname, '../../../.env') });

/**
 * Main migration runner
 */
const runMigrations = async (): Promise<void> => {
  logger.info('Starting database migrations...');

  const { user: migrationUser, password } = migrationCredentials();
  const grantees = resolveGrantees(migrationUser);

  const pool = new Pool({
    host: requiredEnv('DB_HOST'),
    port: parseInt(process.env.DB_PORT ? process.env.DB_PORT : '5432'),
    database: requiredEnv('DB_NAME'),
    user: migrationUser,
    password,
    ssl: dbTlsConfig(),
  });

  const db = drizzle(pool);

  try {
    // Step 1: Run Drizzle schema migrations
    logger.info('Running schema migrations...');
    await migrate(db, { migrationsFolder: resolve(__dirname, '../migrations') });
    logger.info('Schema migrations complete');

    // Step 2: Apply RLS policies
    await applyRLS(db);

    // Step 3: Grant the application roles row access, now and for future tables
    await applyPermissions(db, migrationUser, grantees);

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
runMigrations().catch((error: unknown) => {
  logger.error('Fatal error during migration', {
    error: error instanceof Error ? error.message : error,
  });
  process.exit(1);
});
