import { requiredEnv } from '../lib/env';
import { dbTlsConfig, type DbTlsConfig } from '../lib/tls';

export interface MigrationCredentials {
  user: string;
  password: string;
}

/**
 * Migrations connect as the role that owns the schema, with that role's own password.
 * `DB_PASSWORD` belongs to the runtime role and is never used as a fallback.
 */
export const migrationCredentials = (
  env: NodeJS.ProcessEnv = process.env
): MigrationCredentials => {
  const user = env.DB_MIGRATE_USER;
  const password = env.DB_MIGRATE_PASSWORD;

  if (!user) {
    throw new Error('DB_MIGRATE_USER is required: migrations run as the schema owner');
  }

  if (!password) {
    throw new Error('DB_MIGRATE_PASSWORD is required with DB_MIGRATE_USER');
  }

  return { user, password };
};

export interface MigratorConnection extends MigrationCredentials {
  host: string;
  port: number;
  database: string;
  ssl: DbTlsConfig;
}

/**
 * Everything that connects as the schema owner (migrations, drizzle-kit, the seed and the
 * super-admin bootstrap) connects with these settings.
 */
export const migratorConnection = (env: NodeJS.ProcessEnv = process.env): MigratorConnection => ({
  host: requiredEnv('DB_HOST', env),
  port: parseInt(env.DB_PORT ? env.DB_PORT : '5432'),
  database: requiredEnv('DB_NAME', env),
  ...migrationCredentials(env),
  ssl: dbTlsConfig(env),
});
