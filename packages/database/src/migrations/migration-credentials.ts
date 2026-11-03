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
