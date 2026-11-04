/**
 * Seeds the database (packages/database/seed).
 *
 *   pnpm seed:reference      the reference catalogue and platform organisation; safe anywhere
 *   pnpm seed:db             reference, then the local demo (db-seed.local.dev.json)
 *   pnpm seed:db -- --fresh  empties the catalogue and member data first
 *
 * Connects as DB_MIGRATE_USER / DB_MIGRATE_PASSWORD to DB_HOST / DB_PORT / DB_NAME, over TLS
 * unless DB_TLS_MODE=local. The demo and --fresh need a local database (DB_TLS_MODE=local, not a
 * deployed ENVIRONMENT); the demo's Cognito users need COGNITO_USER_POOL_ID.
 */

import { config } from 'dotenv';
import { seedDatabase } from '../packages/database/seed/index.js';

config();

const args = process.argv.slice(2);
const environment = args.find((arg) => !arg.startsWith('--')) || 'dev';

seedDatabase({
  demo: !args.includes('--reference'),
  fresh: args.includes('--fresh'),
  environment,
})
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
