/**
 * Database Seed Orchestrator
 *
 * Coordinates all database seeding operations from configuration.
 * Reads seed data from db-seed.local.{environment}.json and executes seed functions.
 *
 * Usage:
 *   import { seedDatabase } from '@ffp/database/seed';
 *   await seedDatabase('dev');
 *
 * Environment-specific config files:
 *   - db-seed.local.dev.json (development)
 *   - db-seed.local.test.json (test - future)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import { seedPlatformTenant } from './seedPlatformTenant.js';
import { seedSuperAdminCognito } from './seedSuperAdminCognito.js';
import { seedSuperAdminDatabase } from './seedSuperAdminDatabase.js';
import { seedTestTenant } from './seedTestTenant.js';
import { seedTestCustomer } from './seedTestCustomer.js';
import { seedTestUserCognito } from './seedTestUserCognito.js';
import { seedTestUserDatabase } from './seedTestUserDatabase.js';
import { seedProgrammeTemplates } from './seedProgrammeTemplates.js';
import { seedQuestions } from './seedQuestions.js';
import { seedAssessmentTemplates } from './seedAssessmentTemplates.js';
import { seedAssessmentFlows } from './seedAssessmentFlows.js';
import { seedFlowSteps } from './seedFlowSteps.js';
import type { SeedConfig } from './types.js';

const logger = createLogger('seed');

// Get current file directory for resolving config paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load seed configuration from environment-specific JSON file
 *
 * @param environment - Environment name (dev, staging, test)
 * @returns Parsed seed configuration
 * @throws {Error} If config file not found or invalid JSON
 */
const loadSeedConfig = (environment: string): SeedConfig => {
  const configPath = resolve(__dirname, `config/db-seed.local.${environment}.json`);

  try {
    const configFile = readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile) as SeedConfig;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        `Seed config not found: ${configPath}\n` +
          `Create this file based on config/db-seed.example.json`
      );
    }
    throw error;
  }
};

/**
 * Validates required environment variables for database seeding
 * @throws {Error} If required environment variables are missing
 */
const validateEnvironment = (): void => {
  const required = ['DB_HOST', 'DB_NAME', 'BOOTSTRAP_DB_USER', 'COGNITO_USER_POOL_ID'];

  const missing = required.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    logger.error(
      'Required for database seeding: DB_HOST, DB_NAME, BOOTSTRAP_DB_USER, BOOTSTRAP_DB_PASSWORD, COGNITO_USER_POOL_ID'
    );
    throw new Error('Missing required environment variables');
  }
};

/**
 * Creates database connection pool with bootstrap user credentials
 * Bootstrap user must have BYPASSRLS privilege for seeding
 *
 * @returns Database client with schema
 */
const createDatabaseConnection = (): NodePgDatabase<typeof schema> & { $client: Pool } => {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.BOOTSTRAP_DB_USER,
    password: process.env.BOOTSTRAP_DB_PASSWORD,
    ssl: process.env.ENVIRONMENT === 'development' ? false : { rejectUnauthorized: true },
  });

  return drizzle({ client: pool, schema });
};

/**
 * Seed database with data from configuration
 *
 * @param environment - Environment name (dev, staging, test)
 * @throws {Error} If seeding fails
 *
 */
export const seedDatabase = async (environment: string = 'dev'): Promise<void> => {
  logger.info(`Database Seed - ${environment.toUpperCase()}`);

  // Validate environment variables
  validateEnvironment();

  // Load seed configuration
  const config = loadSeedConfig(environment);
  logger.info(`Loaded seed config: db-seed.local.${environment}.json`);

  // Create database connection
  const db = createDatabaseConnection();

  try {
    // Temporarily disable FORCE RLS to allow seeding
    // FORCE RLS applies even to superusers, so we need to disable it during seeding
    logger.info('Disabling FORCE RLS for seeding...');
    await db.$client.query(`
      ALTER TABLE tenants NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE customers NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE users NO FORCE ROW LEVEL SECURITY;
    `);

    // Seed 1: Platform tenant
    await db.transaction(async (tx) => {
      const txWithClient = tx as unknown as NodePgDatabase<typeof schema> & { $client: Pool };
      txWithClient.$client = db.$client;
      await seedPlatformTenant(txWithClient, config.platformTenant);
    });

    // Seed 2: Super admin user (Cognito)
    await seedSuperAdminCognito(config.superAdminCognito, config.platformTenant);

    // Seed 3: Super admin user (Database)
    await db.transaction(async (tx) => {
      const txWithClient = tx as unknown as NodePgDatabase<typeof schema> & { $client: Pool };
      txWithClient.$client = db.$client;
      await seedSuperAdminDatabase(txWithClient, config.superAdminUser);
    });

    // Seed 4: Test customer tenant
    await db.transaction(async (tx) => {
      const txWithClient = tx as unknown as NodePgDatabase<typeof schema> & { $client: Pool };
      txWithClient.$client = db.$client;
      await seedTestTenant(txWithClient, config.testCustomerTenant);
    });

    // Seed 5: Test customer
    await db.transaction(async (tx) => {
      const txWithClient = tx as unknown as NodePgDatabase<typeof schema> & { $client: Pool };
      txWithClient.$client = db.$client;
      await seedTestCustomer(txWithClient, config.testCustomer);
    });

    // Seed 6: Test customer admin user (Cognito)
    await seedTestUserCognito(
      config.testCustomerAdminCognito,
      config.testCustomerAdminUser,
      config.testCustomerTenant
    );

    // Seed 7: Test customer admin user (Database)
    await db.transaction(async (tx) => {
      const txWithClient = tx as unknown as NodePgDatabase<typeof schema> & { $client: Pool };
      txWithClient.$client = db.$client;
      await seedTestUserDatabase(txWithClient, config.testCustomerAdminUser);
    });

    // Seed 8: Test programme user (Cognito)
    await seedTestUserCognito(
      config.testCustomerProgrammeUserCognito,
      config.testCustomerProgrammeUser,
      config.testCustomerTenant
    );

    // Seed 9: Test programme user (Database)
    await db.transaction(async (tx) => {
      const txWithClient = tx as unknown as NodePgDatabase<typeof schema> & { $client: Pool };
      txWithClient.$client = db.$client;
      await seedTestUserDatabase(txWithClient, config.testCustomerProgrammeUser);
    });

    // Seed 10: Programme templates (no RLS, system-managed lookup table, idempotent)
    // No tenant dependency - these are global templates referenced by scoring config
    await seedProgrammeTemplates(db);

    // Seed 11: Questions (no RLS, idempotent)
    // Must run BEFORE assessment templates as templates reference question UUIDs
    await seedQuestions(db);

    // Seed 12: Assessment templates (no RLS, idempotent)
    // Must run BEFORE assessment flows as flows reference template IDs
    await seedAssessmentTemplates(db);

    // Seed 13: Assessment flows (no RLS, idempotent)
    await seedAssessmentFlows(db);

    // Seed 14: Flow steps (normalised from JSONB, no RLS, idempotent)
    // Must run AFTER assessment flows as steps reference flow IDs
    await seedFlowSteps(db);

    logger.info('Database seeding complete!');
  } catch (error) {
    logger.error('Database seeding failed', {
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  } finally {
    // Re-enable FORCE RLS for security
    logger.info('Re-enabling FORCE RLS...');
    try {
      await db.$client.query(`
        ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
        ALTER TABLE customers FORCE ROW LEVEL SECURITY;
        ALTER TABLE users FORCE ROW LEVEL SECURITY;
      `);
      logger.info('FORCE RLS re-enabled');
    } catch (rlsError) {
      logger.error('Failed to re-enable FORCE RLS', {
        error: rlsError instanceof Error ? rlsError.message : rlsError,
      });
      logger.warn('You must manually re-enable FORCE RLS!');
    }

    await db.$client.end();
  }
};

// Re-export individual seed functions for standalone use
export { seedProgrammeTemplates, PROGRAMME_TEMPLATE_IDS } from './seedProgrammeTemplates.js';
export { seedQuestions, QUESTION_IDS } from './seedQuestions.js';
export { seedAssessmentTemplates, TEMPLATE_IDS } from './seedAssessmentTemplates.js';
export { seedAssessmentFlows, FLOW_IDS } from './seedAssessmentFlows.js';
export { seedFlowSteps, STEP_IDS } from './seedFlowSteps.js';
