import { Pool } from 'pg';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/schema/index.js';
import { customers } from '../src/schema/index.js';
import { createLogger } from '../src/lib/logger.js';
import type { TestCustomerSeed } from './types.js';

const logger = createLogger('seed-test-customer');

/**
 * Seeds the test customer with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedTestCustomer = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: TestCustomerSeed
): Promise<void> => {
  logger.info('Seeding test customer...');

  // Bypass RLS for seed operation (audit trail via logs)
  logger.warn('RLS BYPASSED for seed operation');
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

  logger.info('Test customer seeded', {
    id: data.id,
    name: data.name,
    accountCode: data.accountCode,
    tenantId: data.tenantId,
  });
};
