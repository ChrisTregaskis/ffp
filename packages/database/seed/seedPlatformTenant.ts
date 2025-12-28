import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { tenants } from '../src/schema/index.js';
import { terminalPrefix, TerminalPrefix } from '../src/lib/terminal-logger.js';
import type { PlatformTenantSeed } from './types.js';

/**
 * Seeds the platform tenant with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedPlatformTenant = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: PlatformTenantSeed
): Promise<void> => {
  console.log(`${terminalPrefix(TerminalPrefix.INFO)} Seeding platform tenant...`);

  // Bypass RLS for seed operation (audit trail via console logs)
  console.log(`${terminalPrefix(TerminalPrefix.WARNING)} RLS BYPASSED for seed operation`);
  await db.execute(sql`SET LOCAL row_security = off`);

  // Upsert platform tenant - insert or update if exists
  await db
    .insert(tenants)
    .values({
      id: data.id,
      type: data.type,
      name: data.name,
      settings: data.settings,
      createdAt: sql`${data.createdAt}::timestamp`,
      updatedAt: sql`${data.updatedAt}::timestamp`,
    })
    .onConflictDoUpdate({
      target: tenants.id,
      set: {
        type: data.type,
        name: data.name,
        settings: data.settings,
        updatedAt: sql`${data.updatedAt}::timestamp`,
      },
    });

  console.log(`${terminalPrefix(TerminalPrefix.SUCCESS)} Platform tenant seeded: ${data.id}`);
  console.log(`  Name: ${data.name}`);
  console.log(`  Type: ${data.type}`);
};
