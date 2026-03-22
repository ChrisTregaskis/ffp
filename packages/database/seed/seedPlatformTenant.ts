import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { organisations } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import type { PlatformOrganisationSeed } from './types.js';

const logger = createLogger('seed-platform');

/**
 * Seeds the platform organisation with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedPlatformOrganisation = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: PlatformOrganisationSeed
): Promise<void> => {
  logger.info('Seeding platform organisation...');

  // Bypass RLS for seed operation (audit trail via logs)
  logger.warn('RLS BYPASSED for seed operation');
  await db.execute(sql`SET LOCAL row_security = off`);

  // Upsert platform organisation - insert or update if exists
  await db
    .insert(organisations)
    .values({
      id: data.id,
      type: data.type,
      name: data.name,
      settings: data.settings,
      createdAt: sql`${data.createdAt}::timestamp`,
      updatedAt: sql`${data.updatedAt}::timestamp`,
    })
    .onConflictDoUpdate({
      target: organisations.id,
      set: {
        type: data.type,
        name: data.name,
        settings: data.settings,
        updatedAt: sql`${data.updatedAt}::timestamp`,
      },
    });

  logger.info('Platform organisation seeded', { id: data.id, name: data.name, type: data.type });
};
