import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { tenants } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import type { TestCustomerTenantSeed } from './types.js';

/**
 * Seeds the test customer tenant with exact data from configuration.
 * This is NOT idempotent - it will fail if the tenant already exists.
 */
export const seedTestTenant = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: TestCustomerTenantSeed
): Promise<void> => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding test customer tenant...`);

  // Bypass RLS for seed operation (audit trail via console logs)
  console.log(`${terminalPrefix(TerminalPrefix.WARNING)} RLS BYPASSED for seed operation`);
  await db.execute(sql`SET LOCAL row_security = off`);

  // Insert test customer tenant with exact values from config
  await db.insert(tenants).values({
    id: data.id,
    type: data.type,
    name: data.name,
    settings: data.settings,
    createdAt: sql`${data.createdAt}::timestamp`,
    updatedAt: sql`${data.updatedAt}::timestamp`,
  });

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Test customer tenant seeded: ${data.id}`);
  console.log(`  Name: ${data.name}`);
  console.log(`  Type: ${data.type}`);
};
