import { resolve } from 'path';

import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

import { migratorConnection } from './src/migrations/migration-credentials';

// Load .env from monorepo root (two levels up from this file)
config({ path: resolve(__dirname, '../../.env') });

// drizzle-kit migrates and inspects the schema, so it connects as the role that owns it
export default defineConfig({
  schema: './src/schema/**/*.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: migratorConnection(),
  // Print all statements for transparency
  verbose: true,
  // Always ask for confirmation before applying migrations
  strict: true,
});
