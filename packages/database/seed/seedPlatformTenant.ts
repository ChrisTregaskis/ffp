import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { tenants } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import type { PlatformTenantSeed } from './types.js';

const logger = createLogger('seed-platform');

/**
 * Seeds the platform tenant with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedPlatformTenant = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: PlatformTenantSeed
): Promise<void> => {
  logger.info('Seeding platform tenant...');

  // Bypass RLS for seed operation (audit trail via logs)
  logger.warn('RLS BYPASSED for seed operation');
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

  logger.info('Platform tenant seeded', { id: data.id, name: data.name, type: data.type });
};
