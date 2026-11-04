import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { requiredEnv } from '../src/lib/env.js';
import { dbTlsConfig } from '../src/lib/tls.js';
import { migrationCredentials } from '../src/migrations/migration-credentials.js';
import * as schema from '../src/schema/index.js';

export type MigratorDb = NodePgDatabase<typeof schema> & { $client: Pool };

/**
 * Connects as the role that owns the schema, as migrations do. On a deployed profile the owner
 * is exempt from RLS (NO FORCE), since the database master cannot grant BYPASSRLS; locally RLS
 * still binds it, so writes to tenant tables set their organisation's context.
 */
export const connectAsMigrator = (env: NodeJS.ProcessEnv = process.env): MigratorDb => {
  const { user, password } = migrationCredentials(env);

  const pool = new Pool({
    host: requiredEnv('DB_HOST', env),
    port: parseInt(env.DB_PORT ? env.DB_PORT : '5432'),
    database: requiredEnv('DB_NAME', env),
    user,
    password,
    ssl: dbTlsConfig(env),
  });

  return drizzle({ client: pool, schema });
};
