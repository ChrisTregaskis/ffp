import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { users } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import type { TestUserSeed } from './types.js';

/**
 * Seeds a test user record in the database with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedTestUserDatabase = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: TestUserSeed
): Promise<void> => {
  console.log(
    `${terminalPrefix(TerminalPrefix.INFO)} Seeding test user in database (${data.role})...`
  );

  // Bypass RLS for seed operation (audit trail via console logs)
  console.log(`${terminalPrefix(TerminalPrefix.WARNING)} RLS BYPASSED for seed operation`);
  await db.execute(sql`SET LOCAL row_security = off`);

  // Upsert test user - insert or update if exists
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
      dateOfBirth: data.dateOfBirth ? sql`${data.dateOfBirth}::date` : null,
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
        dateOfBirth: data.dateOfBirth ? sql`${data.dateOfBirth}::date` : null,
        updatedAt: sql`${data.updatedAt}::timestamp`,
      },
    });

  console.log(
    `${terminalPrefix(TerminalPrefix.SUCCESS)} Test user seeded in database (${data.role}): ${data.id}`
  );
  console.log(`  Email: ${data.email}`);
  console.log(`  Tenant ID: ${data.tenantId}`);
  console.log(`  Role: ${data.role}`);
};
