import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { locations } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import type { TestLocationSeed } from './types.js';

const logger = createLogger('seed-test-location');

/**
 * Seeds the test location with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedTestLocation = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: TestLocationSeed
): Promise<void> => {
  logger.info('Seeding test location...');

  // Bypass RLS for seed operation (audit trail via logs)
  logger.warn('RLS BYPASSED for seed operation');
  await db.execute(sql`SET LOCAL row_security = off`);

  // Upsert test location - insert or update if exists
  await db
    .insert(locations)
    .values({
      id: data.id,
      organisationId: data.organisationId,
      name: data.name,
      accountCode: data.accountCode,
      address: data.address,
      status: data.status,
      createdAt: sql`${data.createdAt}::timestamp`,
      updatedAt: sql`${data.updatedAt}::timestamp`,
    })
    .onConflictDoUpdate({
      target: locations.id,
      set: {
        organisationId: data.organisationId,
        name: data.name,
        accountCode: data.accountCode,
        address: data.address,
        status: data.status,
        updatedAt: sql`${data.updatedAt}::timestamp`,
      },
    });

  logger.info('Test location seeded', {
    id: data.id,
    name: data.name,
    accountCode: data.accountCode,
    organisationId: data.organisationId,
  });
};
