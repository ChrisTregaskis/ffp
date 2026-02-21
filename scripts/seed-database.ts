/**
 * Database Seed Script
 *
 * Thin wrapper script that calls the database seed package.
 * Allows running seed operations from the command line with environment selection.
 *
 * Usage:
 *   pnpm seed:db              # Seeds dev environment (default)
 *   pnpm seed:db staging      # Seeds staging environment (future)
 *   pnpm seed:db test         # Seeds test environment (future)
 *   pnpm seed:db -- --fresh   # Truncates content tables before seeding (for UUID changes)
 *
 * Configuration:
 *   Seed data is loaded from packages/database/seed/config/db-seed.local.{env}.json
 *   Create your local config based on db-seed.example.json
 *
 * Environment Variables Required:
 *   - DB_HOST, DB_NAME: Database connection
 *   - BOOTSTRAP_DB_USER, BOOTSTRAP_DB_PASSWORD: Superuser with BYPASSRLS
 *   - COGNITO_USER_POOL_ID: AWS Cognito User Pool
 */

import { config } from 'dotenv';
import { seedDatabase } from '../packages/database/seed/index.js';

// Load environment variables
config();

// Parse command line args
const args = process.argv.slice(2);
const fresh = args.includes('--fresh');
const environment = args.find((arg) => !arg.startsWith('--')) || 'dev';

// Run seed
seedDatabase(environment, { fresh })
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
