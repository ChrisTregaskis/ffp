import { sql } from 'drizzle-orm';

import { createLogger } from '../lib/logger';
import { isDeployedEnvironment } from '../lib/runtime-profile';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

const logger = createLogger('permissions');

/**
 * The roles given table access: the runtime role (`DB_USER`) always, and the test role
 * (`DB_TEST_USER`) only where tests run and only when asked for. Resolved before migrating,
 * so a misconfigured run fails before it changes anything.
 */
export const resolveGrantees = (
  migrationUser: string,
  env: NodeJS.ProcessEnv = process.env
): string[] => {
  const runtimeUser = env.DB_USER;

  if (!runtimeUser) {
    throw new Error('DB_USER (the runtime role) is required to apply permissions');
  }

  // RLS never binds a table's owner on a deployed profile, and revoking from the owner would
  // strip its own privileges
  if (runtimeUser === migrationUser) {
    throw new Error(`The runtime role must not be the migration role ("${migrationUser}")`);
  }

  const testUser = env.DB_TEST_USER;

  if (!testUser) {
    return [runtimeUser];
  }

  if (isDeployedEnvironment(env.ENVIRONMENT)) {
    throw new Error(`DB_TEST_USER is not allowed when ENVIRONMENT is "${String(env.ENVIRONMENT)}"`);
  }

  return [...new Set([runtimeUser, testUser])];
};

/**
 * Grants each application role row access (no TRUNCATE, no DDL) on every existing table and
 * sequence, and sets the migration role's default privileges so tables it creates later carry
 * the same grants. TRUNCATE is revoked explicitly, so a database granted it before loses it.
 * Runs in one transaction: a missing role, a role that inherits the owner, or a failed grant
 * fails the migration and changes nothing.
 *
 * @param db - Drizzle database instance, connected as the migration role
 * @param migrationUser - The role that owns the schema objects
 * @param grantees - From `resolveGrantees`
 */
export const applyPermissions = async <TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>,
  migrationUser: string,
  grantees: string[]
): Promise<void> => {
  const owner = sql.identifier(migrationUser);

  logger.info('Applying database permissions...', { migrationUser, grantees });

  await db.transaction(async (tx) => {
    for (const grantee of grantees) {
      // A member of the owner counts as the owner, which RLS does not bind unless forced
      const { rows } = await tx.execute<{ inherits_owner: boolean }>(sql`
        SELECT pg_has_role(rolname, ${migrationUser}, 'USAGE') AS inherits_owner
        FROM pg_roles WHERE rolname = ${grantee}
      `);

      if (rows.length === 0) {
        throw new Error(`Role "${grantee}" does not exist; create it before migrating`);
      }

      if (rows[0].inherits_owner) {
        throw new Error(`Role "${grantee}" inherits the migration role "${migrationUser}"`);
      }

      const role = sql.identifier(grantee);

      await tx.execute(sql`
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role}
      `);
      await tx.execute(sql`REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM ${role}`);
      await tx.execute(sql`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${role}`);

      await tx.execute(sql`
        ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${role}
      `);
      await tx.execute(sql`
        ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public
        REVOKE TRUNCATE ON TABLES FROM ${role}
      `);
      await tx.execute(sql`
        ALTER DEFAULT PRIVILEGES FOR ROLE ${owner} IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${role}
      `);
    }
  });

  logger.info('Database permissions applied', { grantees });
};
