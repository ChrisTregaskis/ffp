/**
 * Bootstrap Super Admin Script
 *
 * Creates the initial super admin user for the FFP platform.
 * This script should only be run once during initial platform setup per environment.
 *
 * What it does:
 * 1. Creates a platform tenant (type='platform') in the database
 * 2. Creates a super admin user in AWS Cognito
 * 3. Links the Cognito user to the platform tenant in the database
 *
 * Usage:
 *   pnpm bootstrap:super-admin
 *
 * Environment Variables Required:
 *   - SUPER_ADMIN_EMAIL: Email address for the super admin
 *   - DB_HOST, DB_PORT, DB_NAME: Database connection details
 *   - BOOTSTRAP_DB_USER: Database user with BYPASSRLS privilege (superuser/master user)
 *   - BOOTSTRAP_DB_PASSWORD: Password for bootstrap user
 *   - COGNITO_USER_POOL_ID: AWS Cognito User Pool ID
 *   - COGNITO_CLIENT_ID: AWS Cognito Client ID
 *   - AWS_REGION: AWS region (defaults to eu-west-2)
 *
 * Bootstrap User Requirements:
 *   - Local dev: Use your macOS username (PostgreSQL superuser)
 *   - Staging/Prod: Use RDS master user (created when RDS instance was provisioned)
 *
 * Security Note:
 *   !This script bypasses RLS to create the initial tenant (chicken-and-egg problem)
 *   !Intended usage is to only run this once per environment during initial setup
 *   - Regular application code will use DB_USER (without BYPASSRLS)
 */

import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../packages/database/src/schema/index.js';
import { tenants, users } from '../packages/database/src/schema/index.js';
import { CognitoService } from '../packages/core/src/lib/cognito.js';
import { terminalPrefix, TerminalPrefix } from '../packages/database/src/lib/terminal-logger.js';
import { config } from 'dotenv';

config(); // Load environment variables

/**
 * Configuration
 */
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const PLATFORM_TENANT_NAME = 'FFP Platform';
const TEMPORARY_PASSWORD = 'TempPass123!'; // User must change on first login

/**
 * Validates required environment variables
 */
const validateEnvironment = () => {
  const required = [
    'SUPER_ADMIN_EMAIL',
    'DB_HOST',
    'DB_NAME',
    'COGNITO_USER_POOL_ID',
    'COGNITO_CLIENT_ID',
  ];

  const missing = required.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(
      `${terminalPrefix(TerminalPrefix.ERROR)} Missing required environment variables: ${missing.join(', ')}`
    );
    console.error('\nUsage:');
    console.error('  SUPER_ADMIN_EMAIL=name@ffp.com tsx scripts/bootstrap-super-admin.ts\n');
    process.exit(1);
  }

  // Check for bootstrap DB user (must have BYPASSRLS privilege)
  if (!process.env.BOOTSTRAP_DB_USER) {
    console.error(`${terminalPrefix(TerminalPrefix.ERROR)} BOOTSTRAP_DB_USER not set`);
    console.error('\nBootstrap requires a database user with BYPASSRLS privilege.');
    console.error('Set BOOTSTRAP_DB_USER and BOOTSTRAP_DB_PASSWORD in .env\n');
    console.error('Local dev: Use your superuser (e.g., your macOS username)');
    console.error('Staging/Prod: Use RDS master user\n');
    process.exit(1);
  }
};

/**
 * Creates the platform tenant in the database
 */
const createPlatformTenant = async (db: NodePgDatabase<typeof schema> & { $client: Pool }) => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Creating platform tenant...`);

  // Bypass RLS for bootstrap operation (chicken-and-egg: can't set tenant context without a tenant)
  await db.$client.query('SET LOCAL row_security = off');

  // Check if platform tenant already exists
  const existingTenant = await db.query.tenants.findFirst({
    where: eq(tenants.type, 'platform'),
  });

  if (existingTenant) {
    console.log(`${terminalPrefix(TerminalPrefix.WARNING)} Platform tenant already exists`);
    return existingTenant;
  }

  // Create new platform tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      type: 'platform',
      name: PLATFORM_TENANT_NAME,
      settings: {},
    })
    .returning();

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Platform tenant created: ${tenant.id}`);
  return tenant;
};

/**
 * Creates the super admin user in Cognito
 */
const createCognitoUser = async (tenantId: string) => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Creating Cognito user...`);

  try {
    const response = await CognitoService.createUser({
      email: SUPER_ADMIN_EMAIL!,
      firstName: 'Super',
      lastName: 'Admin',
      tenantId: tenantId,
      customerId: null, // Super admin has no customer
      role: 'system_admin',
      temporaryPassword: TEMPORARY_PASSWORD,
    });

    const cognitoSub = response.User?.Attributes?.find((attr) => attr.Name === 'sub')?.Value;

    if (!cognitoSub) {
      throw new Error('Failed to retrieve Cognito sub from user creation response');
    }

    console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Cognito user created`);
    console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`  Cognito Sub: ${cognitoSub}`);
    console.log(`  Temporary Password: ${TEMPORARY_PASSWORD}`);

    return cognitoSub;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'UsernameExistsException') {
        console.error(
          `${terminalPrefix(TerminalPrefix.ERROR)} User with email ${SUPER_ADMIN_EMAIL} already exists in Cognito`
        );
        console.error('Please delete the existing user or use a different email address.\n');
        process.exit(1);
      }
    }
    throw error;
  }
};

/**
 * Creates the user record in the database
 */
const createDatabaseUser = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  tenantId: string,
  cognitoSub: string,
  userId: string
) => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Creating database user record...`);

  // Bypass RLS for bootstrap operation
  await db.$client.query('SET LOCAL row_security = off');

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, SUPER_ADMIN_EMAIL!),
  });

  if (existingUser) {
    console.log(`${terminalPrefix(TerminalPrefix.WARNING)} User record already exists in database`);
    return existingUser;
  }

  // Create new user record
  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      tenantId: tenantId,
      email: SUPER_ADMIN_EMAIL!,
      cognitoSub: cognitoSub,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'system_admin',
      customerId: null, // Super admin has no customer
    })
    .returning();

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Database user record created: ${user.id}`);
  return user;
};

/**
 * Main execution
 */
const main = async () => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Bootstrap Super Admin Script\n`);

  // Validate environment
  validateEnvironment();

  // Setup database connection with bootstrap user (must have BYPASSRLS)
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.BOOTSTRAP_DB_USER, // Superuser with BYPASSRLS privilege
    password: process.env.BOOTSTRAP_DB_PASSWORD,
    ssl: process.env.ENVIRONMENT === 'development' ? false : { rejectUnauthorized: true },
  });

  const db = drizzle({ client: pool, schema });

  try {
    // Step 1: Create platform tenant
    const tenant = await createPlatformTenant(db);

    // Step 2: Create Cognito user
    const cognitoSub = await createCognitoUser(tenant.id);

    // Step 3: Generate a UUID for the user
    const userIdResult = await pool.query('SELECT gen_random_uuid() as id');
    const userId = userIdResult.rows[0].id;

    // Step 4: Create database user record
    await createDatabaseUser(db, tenant.id, cognitoSub, userId);

    // Success!
    console.log(`\n${terminalPrefix(TerminalPrefix.SUCCESS)} Super admin bootstrap complete!\n`);
    console.log('Login Details:');
    console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`  Temporary Password: ${TEMPORARY_PASSWORD}`);
    console.log('\nNOTE: You will be required to change your password on first login.\n');
  } catch (error) {
    console.error(`\n${terminalPrefix(TerminalPrefix.ERROR)} Bootstrap failed:`, error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
