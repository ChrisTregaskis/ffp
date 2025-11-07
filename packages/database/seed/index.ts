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
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import { seedPlatformTenant } from './seedPlatformTenant.js';
import { seedSuperAdminCognito } from './seedSuperAdminCognito.js';
import { seedSuperAdminDatabase } from './seedSuperAdminDatabase.js';
import type { SeedConfig } from './types.js';

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
function loadSeedConfig(environment: string): SeedConfig {
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
}

/**
 * Validates required environment variables for database seeding
 * @throws {Error} If required environment variables are missing
 */
function validateEnvironment(): void {
  const required = ['DB_HOST', 'DB_NAME', 'BOOTSTRAP_DB_USER', 'COGNITO_USER_POOL_ID'];

  const missing = required.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(
      `${terminalPrefix(TerminalPrefix.ERROR)} Missing required environment variables: ${missing.join(', ')}`
    );
    console.error('\nRequired for database seeding:');
    console.error('  - DB_HOST, DB_NAME: Database connection');
    console.error('  - BOOTSTRAP_DB_USER, BOOTSTRAP_DB_PASSWORD: Superuser with BYPASSRLS');
    console.error('  - COGNITO_USER_POOL_ID: AWS Cognito User Pool\n');
    throw new Error('Missing required environment variables');
  }
}

/**
 * Creates database connection pool with bootstrap user credentials
 * Bootstrap user must have BYPASSRLS privilege for seeding
 *
 * @returns Database client with schema
 */
function createDatabaseConnection(): NodePgDatabase<typeof schema> & { $client: Pool } {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.BOOTSTRAP_DB_USER,
    password: process.env.BOOTSTRAP_DB_PASSWORD,
    ssl: process.env.ENVIRONMENT === 'development' ? false : { rejectUnauthorized: true },
  });

  return drizzle({ client: pool, schema });
}

/**
 * Seed database with data from configuration
 *
 * Executes seed operations in order:
 * 1. Platform tenant (database)
 * 2. Super admin user (Cognito)
 * 3. Super admin user (database)
 *
 * @param environment - Environment name (dev, staging, test)
 * @throws {Error} If seeding fails
 *
 */
export async function seedDatabase(environment: string = 'dev'): Promise<void> {
  console.log(
    `${terminalPrefix(TerminalPrefix.INFO)} Database Seed - ${environment.toUpperCase()}\n`
  );

  // Validate environment variables
  validateEnvironment();

  // Load seed configuration
  const config = loadSeedConfig(environment);
  console.log(
    `${terminalPrefix(TerminalPrefix.SUCCESS)} Loaded seed config: db-seed.local.${environment}.json\n`
  );

  // Create database connection
  const db = createDatabaseConnection();

  try {
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

    // Future seed operations can be added here:
    // await seedSampleBusinesses(db, config.sampleBusinesses);
    // await seedSampleCustomers(db, config.sampleCustomers);

    console.log(`\n${terminalPrefix(TerminalPrefix.SUCCESS)} Database seeding complete!\n`);
  } catch (error) {
    console.error(`\n${terminalPrefix(TerminalPrefix.ERROR)} Database seeding failed:`, error);
    throw error;
  } finally {
    await db.$client.end();
  }
}
