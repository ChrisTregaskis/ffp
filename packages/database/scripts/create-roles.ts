/**
 * Creates or updates the two database roles a deployed environment runs on (`pnpm db:roles`).
 * Run as the server's master user once per environment, before the first `pnpm db:migrate`;
 * safe to re-run, which also rotates both passwords to the values supplied.
 *
 * - Migrator (DB_MIGRATE_USER / DB_MIGRATE_PASSWORD): owns the schema objects. May create
 *   schemas and tables; not a superuser, no BYPASSRLS.
 * - Runtime (DB_USER / DB_PASSWORD): CONNECT and schema USAGE only. Its table grants come
 *   from the migration (`applyPermissions`), so it can never create or alter objects.
 *
 * Connects as DB_MASTER_USER / DB_MASTER_PASSWORD to DB_HOST / DB_PORT / DB_NAME, over the
 * shared TLS rule. Passwords are sent as SCRAM verifiers, never as plain text, so they cannot
 * surface in the server's statement log.
 */
import { createHash, createHmac, pbkdf2Sync, randomBytes } from 'crypto';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { config } from 'dotenv';
import { Client } from 'pg';

import { requiredEnv } from '../src/lib/env';
import { createLogger } from '../src/lib/logger';
import { dbTlsConfig } from '../src/lib/tls';
import { migrationCredentials } from '../src/migrations/migration-credentials';

const logger = createLogger('create-roles');

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });

const SCRAM_ITERATIONS = 4096;

// The verifier Postgres itself stores for SCRAM-SHA-256 (RFC 5802 / 7677). SASLprep leaves
// printable ASCII unchanged; anything else could hash differently from what the server expects.
const scramVerifier = (password: string): string => {
  if (!/^[\x20-\x7e]+$/.test(password)) {
    throw new Error('Role passwords must be printable ASCII');
  }

  const salt = randomBytes(16);
  const salted = pbkdf2Sync(password, salt, SCRAM_ITERATIONS, 32, 'sha256');
  const clientKey = createHmac('sha256', salted).update('Client Key').digest();
  const storedKey = createHash('sha256').update(clientKey).digest('base64');
  const serverKey = createHmac('sha256', salted).update('Server Key').digest('base64');

  return `SCRAM-SHA-256$${String(SCRAM_ITERATIONS)}:${salt.toString('base64')}$${storedKey}:${serverKey}`;
};

interface RoleSpec {
  name: string;
  password: string;
}

// SUPERUSER and BYPASSRLS are never named: on RDS the master holds neither, and naming one
// even to turn it off is refused. The defaults are off; `verifyRoles` checks they stayed off.
const upsertLoginRole = async (client: Client, { name, password }: RoleSpec): Promise<void> => {
  const existing = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [name]);
  const statement = existing.rowCount === 0 ? 'CREATE' : 'ALTER';

  await client.query(
    `${statement} ROLE ${client.escapeIdentifier(name)} WITH LOGIN PASSWORD ${client.escapeLiteral(
      scramVerifier(password)
    )}`
  );

  logger.info(`Role ${statement === 'CREATE' ? 'created' : 'updated'}`, { role: name });
};

const verifyRoles = async (
  client: Client,
  database: string,
  migrator: string,
  runtime: string
): Promise<void> => {
  const { rows } = await client.query<{
    rolname: string;
    rolsuper: boolean;
    rolbypassrls: boolean;
    rolcreatedb: boolean;
    rolcreaterole: boolean;
  }>(
    `SELECT rolname, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
     FROM pg_roles WHERE rolname = ANY($1)`,
    [[migrator, runtime]]
  );

  for (const role of rows) {
    if (role.rolsuper || role.rolbypassrls || role.rolcreatedb || role.rolcreaterole) {
      throw new Error(
        `Role "${role.rolname}" must not be a superuser or have BYPASSRLS, CREATEDB or CREATEROLE`
      );
    }
  }

  const {
    rows: [runtimeAccess],
  } = await client.query<{
    schema_create: boolean;
    database_create: boolean;
    inherits_migrator: boolean;
    all_data: boolean;
  }>(
    `SELECT has_schema_privilege($1, 'public', 'CREATE') AS schema_create,
            has_database_privilege($1, $2, 'CREATE') AS database_create,
            pg_has_role($1, $3, 'USAGE') AS inherits_migrator,
            pg_has_role($1, 'pg_read_all_data', 'MEMBER')
              OR pg_has_role($1, 'pg_write_all_data', 'MEMBER') AS all_data`,
    [runtime, database, migrator]
  );

  // A member of the migrator counts as the tables' owner, which unforced RLS does not bind
  if (runtimeAccess.inherits_migrator || runtimeAccess.all_data) {
    throw new Error(
      `Runtime role "${runtime}" must not be a member of "${migrator}" or a predefined data role`
    );
  }

  if (runtimeAccess.schema_create || runtimeAccess.database_create) {
    throw new Error(
      `Runtime role "${runtime}" can create objects (possibly through PUBLIC); revoke CREATE first`
    );
  }
};

const createRoles = async (): Promise<void> => {
  const database = requiredEnv('DB_NAME');
  const master = requiredEnv('DB_MASTER_USER');
  const migrator = migrationCredentials();
  const runtime: RoleSpec = { name: requiredEnv('DB_USER'), password: requiredEnv('DB_PASSWORD') };

  if (new Set([master, migrator.user, runtime.name]).size !== 3) {
    throw new Error('DB_MASTER_USER, DB_MIGRATE_USER and DB_USER must be three different roles');
  }

  const client = new Client({
    host: requiredEnv('DB_HOST'),
    port: parseInt(process.env.DB_PORT ? process.env.DB_PORT : '5432'),
    database,
    user: master,
    password: requiredEnv('DB_MASTER_PASSWORD'),
    ssl: dbTlsConfig(),
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    await upsertLoginRole(client, { name: migrator.user, password: migrator.password });
    await upsertLoginRole(client, runtime);

    const db = client.escapeIdentifier(database);
    const migratorRole = client.escapeIdentifier(migrator.user);
    const runtimeRole = client.escapeIdentifier(runtime.name);

    // Database CREATE lets the migrator create the migration tracker's own schema
    await client.query(`GRANT CONNECT, CREATE ON DATABASE ${db} TO ${migratorRole}`);
    await client.query(`GRANT USAGE, CREATE ON SCHEMA public TO ${migratorRole}`);
    await client.query(`GRANT CONNECT ON DATABASE ${db} TO ${runtimeRole}`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${runtimeRole}`);

    await verifyRoles(client, database, migrator.user, runtime.name);

    await client.query('COMMIT');
    logger.info('Roles ready', { database, migrator: migrator.user, runtime: runtime.name });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};

createRoles().catch((error: unknown) => {
  logger.error('Creating roles failed', { error: error instanceof Error ? error.message : error });
  process.exit(1);
});
