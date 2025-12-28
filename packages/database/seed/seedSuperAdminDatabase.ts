import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { users } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import type { SuperAdminUserSeed } from './types.js';

/**
 * Seeds the super admin user record in the database with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedSuperAdminDatabase = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: SuperAdminUserSeed
): Promise<void> => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding super admin in database...`);

  // Bypass RLS for seed operation (audit trail via console logs)
  console.log(`${terminalPrefix(TerminalPrefix.WARNING)} RLS BYPASSED for seed operation`);
  await db.execute(sql`SET LOCAL row_security = off`);

  // Upsert super admin user - insert or update if exists
  await db
    .insert(users)
    .values({
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
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
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
        updatedAt: sql`${data.updatedAt}::timestamp`,
      },
    });

  console.log(
    `${terminalPrefix(TerminalPrefix.SUCCESS)} Super admin seeded in database: ${data.id}`
  );
  console.log(`  Email: ${data.email}`);
  console.log(`  Tenant ID: ${data.tenantId}`);
  console.log(`  Role: ${data.role}`);
};
