import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { users } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import type { SuperAdminUserSeed } from './types.js';

/**
 * Seeds the super admin user record in the database with exact data from configuration.
 * This is NOT idempotent - it will fail if the user already exists.
 *
 * @param db - Database client with RLS bypass capability
 * @param data - Super admin user seed data (schema-derived with string timestamps)
 * @throws {Error} If user insertion fails
 */
export const seedSuperAdminDatabase = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: SuperAdminUserSeed
): Promise<void> => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding super admin in database...`);

  // Bypass RLS for seed operation (audit trail via console logs)
  console.log(`${terminalPrefix(TerminalPrefix.WARNING)} RLS BYPASSED for seed operation`);
  await db.$client.query('SET LOCAL row_security = off');

  // Insert super admin user with exact values from config
  await db.insert(users).values({
    id: data.id,
    tenantId: data.tenantId,
    email: data.email,
    cognitoSub: data.cognitoSub,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    customerId: data.customerId,
    profileImageUrl: data.profileImageUrl,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    createdAt: sql`${data.createdAt}::timestamp`,
    updatedAt: sql`${data.updatedAt}::timestamp`,
  });

  console.log(
    `${terminalPrefix(TerminalPrefix.SUCCESS)} Super admin seeded in database: ${data.id}`
  );
  console.log(`  Email: ${data.email}`);
  console.log(`  Tenant ID: ${data.tenantId}`);
  console.log(`  Role: ${data.role}`);
};
