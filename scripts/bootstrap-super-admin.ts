/**
 * Creates the first system admin, in the platform organisation the reference seed creates.
 *
 *   SUPER_ADMIN_EMAIL=name@example.com pnpm bootstrap:super-admin
 *   SUPER_ADMIN_EMAIL=name@example.com pnpm bootstrap:super-admin -- --link-existing
 *
 * Order on a new environment: db:roles, db:migrate, seed:reference, then this. Cognito
 * generates the temporary password and emails it to the admin; nothing secret is printed.
 * `--link-existing` links a Cognito user that already exists (a database rebuilt while the user
 * pool survived), provided it is a system admin of the platform organisation.
 *
 * Needs SUPER_ADMIN_EMAIL (optionally SUPER_ADMIN_FIRST_NAME / SUPER_ADMIN_LAST_NAME),
 * COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, COGNITO_REGION (default eu-west-2), and the database
 * settings migrations use: DB_HOST, DB_PORT, DB_NAME, DB_MIGRATE_USER, DB_MIGRATE_PASSWORD,
 * DB_TLS_MODE.
 */

// First, so the Cognito client reads COGNITO_REGION from .env when its module loads
import 'dotenv/config';

import { CognitoService } from '../packages/core/src/lib/cognito.js';
import { requiredEnv } from '../packages/database/src/lib/env.js';
import { connectAsMigrator } from '../packages/database/src/migrations/connection.js';
import { bootstrapSuperAdmin } from '../packages/database/src/seed/bootstrapSuperAdmin.js';

// The .env example leaves the names empty, and an empty value falls back too
const envOr = (key: string, fallback: string): string => {
  const value = process.env[key];

  return value ? value : fallback;
};

const main = async (): Promise<void> => {
  const email = requiredEnv('SUPER_ADMIN_EMAIL');
  const db = connectAsMigrator();

  try {
    const { linked } = await bootstrapSuperAdmin(
      db,
      {
        createUser: async (user) => {
          const response = await CognitoService.createUser({
            ...user,
            locationId: null,
            role: 'system_admin',
          });
          const sub = response.User?.Attributes?.find((attr) => attr.Name === 'sub')?.Value;

          if (!sub) {
            await CognitoService.deleteUser(user.email);
            throw new Error('Cognito returned no sub for the new user; the user has been deleted');
          }

          return sub;
        },
        getUserAttributes: (username) => CognitoService.getUserAttributes(username),
        deleteUser: (username) => CognitoService.deleteUser(username),
      },
      {
        email,
        firstName: envOr('SUPER_ADMIN_FIRST_NAME', 'System'),
        lastName: envOr('SUPER_ADMIN_LAST_NAME', 'Admin'),
      },
      { linkExisting: process.argv.includes('--link-existing') }
    );

    console.log(
      linked
        ? `Super admin linked to the existing Cognito user ${email}; its password is unchanged.`
        : `Super admin created. Cognito has emailed ${email} a temporary password.`
    );
  } finally {
    await db.$client.end();
  }
};

main().catch((error: unknown) => {
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : '';

  console.error('Bootstrap failed:', error instanceof Error ? error.message : error, cause);
  process.exit(1);
});
