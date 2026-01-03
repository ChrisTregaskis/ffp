/**
 * Apply Database Permissions Module
 *
 * This module sets up DEFAULT PRIVILEGES so that when the migration user (root_user)
 * creates new tables, application users automatically receive the necessary
 * permissions (SELECT, INSERT, UPDATE, DELETE, TRUNCATE).
 *
 * This is critical for:
 * - Application runtime (DB_USER): Used by Lambda functions
 * - Integration tests (test_user): Used by Vitest (dev/test environments only)
 *
 * **Environment Variables:**
 * - DB_MIGRATE_USER: The user running migrations (e.g., root_user)
 *   - This user owns all database objects
 *   - DEFAULT PRIVILEGES are set FOR this user
 * - DB_USER: Application runtime user (e.g., app_user, ffp_prod_user)
 *   - Permissions always granted to this user
 *
 * **Optional Users:**
 * - test_user: Integration test user (hardcoded in vitest configs)
 *   - Only exists in dev/test environments, skipped if not present
 *
 * This module is idempotent - safe to run multiple times.
 *
 * @module migrations/apply-permissions
 */

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { terminalPrefix, TerminalPrefix, colorText } from '../lib/terminal-logger';

/**
 * Get users that need table access permissions
 *
 * - DB_USER (from env): Application runtime user (Lambda functions)
 * - test_user: Integration tests (Vitest) - only in dev/test environments
 *
 * @returns Array of unique usernames to grant permissions to
 */
const getApplicationUsers = (): string[] => {
  const users = new Set<string>();

  // Application runtime user from environment
  const dbUser = process.env.DB_USER;
  if (dbUser) {
    users.add(dbUser);
  }

  // Test user for integration tests (only exists in dev/test environments)
  // This is hardcoded because vitest.config.ts uses 'test_user' explicitly
  users.add('test_user');

  return Array.from(users);
};

/**
 * Apply database permissions for application and test users
 *
 * This function:
 * 1. Sets DEFAULT PRIVILEGES for the migration user so new tables automatically grant access
 * 2. Grants permissions on all existing tables in the public schema
 *
 * @param db - Drizzle database instance
 * @param migrationUser - The user running migrations (e.g., root_user)
 * @returns Promise<void>
 */
export const applyPermissions = async (
  db: NodePgDatabase<any>,
  migrationUser: string
): Promise<void> => {
  const applicationUsers = getApplicationUsers();

  console.log(`${terminalPrefix(TerminalPrefix.MIGRATE)} Applying database permissions...`);
  console.log(`  - Migration user: ${colorText(migrationUser, 'cyan')}`);
  console.log(`  - Application users: ${colorText(applicationUsers.join(', '), 'cyan')}`);

  for (const user of applicationUsers) {
    try {
      // Check if user exists
      const userExists = await db.execute(sql`
        SELECT 1 FROM pg_roles WHERE rolname = ${user}
      `);

      if (userExists.rows.length === 0) {
        console.log(
          `  - ${colorText('SKIP', 'yellow')} User '${user}' does not exist (may be intentional in some environments)`
        );
        continue;
      }

      // Set DEFAULT PRIVILEGES for new tables created by migration user
      // This ensures future tables automatically grant permissions
      // TRUNCATE is needed for test cleanup (CASCADE operations)
      await db.execute(sql`
        ALTER DEFAULT PRIVILEGES FOR ROLE ${sql.raw(migrationUser)} IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON TABLES TO ${sql.raw(user)}
      `);

      // Grant permissions on all existing tables in public schema
      // This ensures current tables have the correct permissions
      // TRUNCATE is needed for test cleanup (CASCADE operations)
      await db.execute(sql`
        GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO ${sql.raw(user)}
      `);

      // Grant usage on all sequences (needed for INSERT with auto-increment)
      await db.execute(sql`
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${sql.raw(user)}
      `);

      // Set DEFAULT PRIVILEGES for sequences too
      await db.execute(sql`
        ALTER DEFAULT PRIVILEGES FOR ROLE ${sql.raw(migrationUser)} IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO ${sql.raw(user)}
      `);

      console.log(`  - ${colorText('✓', 'green')} Permissions granted to '${user}'`);
    } catch (error) {
      // Log but don't fail - user might not exist in all environments
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `  - ${colorText('WARN', 'yellow')} Could not grant permissions to '${user}': ${message}`
      );
    }
  }

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Database permissions applied`);
};
