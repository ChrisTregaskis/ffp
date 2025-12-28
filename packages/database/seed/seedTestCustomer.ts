import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { customers } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import type { TestCustomerSeed } from './types.js';

/**
 * Seeds the test customer with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedTestCustomer = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: TestCustomerSeed
): Promise<void> => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding test customer...`);

  // Bypass RLS for seed operation (audit trail via console logs)
  console.log(`${terminalPrefix(TerminalPrefix.WARNING)} RLS BYPASSED for seed operation`);
  await db.execute(sql`SET LOCAL row_security = off`);

  // Upsert test customer - insert or update if exists
  await db
    .insert(customers)
    .values({
      id: data.id,
      tenantId: data.tenantId,
      name: data.name,
      accountCode: data.accountCode,
      address: data.address,
      status: data.status,
      createdAt: sql`${data.createdAt}::timestamp`,
      updatedAt: sql`${data.updatedAt}::timestamp`,
    })
    .onConflictDoUpdate({
      target: customers.id,
      set: {
        tenantId: data.tenantId,
        name: data.name,
        accountCode: data.accountCode,
        address: data.address,
        status: data.status,
        updatedAt: sql`${data.updatedAt}::timestamp`,
      },
    });

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Test customer seeded: ${data.id}`);
  console.log(`  Name: ${data.name}`);
  console.log(`  Account Code: ${data.accountCode}`);
  console.log(`  Tenant ID: ${data.tenantId}`);
};
