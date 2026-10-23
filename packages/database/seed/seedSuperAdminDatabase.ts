import { sql } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type Pool } from 'pg';

import { createLogger } from '../src/lib/logger.js';
import { users } from '../src/schema/index.js';

import type { SuperAdminUserSeed } from './types.js';
import type * as schema from '../src/schema/index.js';

const logger = createLogger('seed-super-admin-db');

/**
 * Seeds the super admin user record in the database with exact data from configuration.
 * Idempotent: uses upsert to update existing records or insert new ones.
 */
export const seedSuperAdminDatabase = async (
  db: NodePgDatabase<typeof schema> & { $client: Pool },
  data: SuperAdminUserSeed
): Promise<void> => {
  logger.info('Seeding super admin in database...');

  // Bypass RLS for seed operation (audit trail via logs)
  logger.warn('RLS BYPASSED for seed operation');
  await db.execute(sql`SET LOCAL row_security = off`);

  // Upsert super admin user - insert or update if exists
  await db
    .insert(users)
    .values({
      id: data.id,
      organisationId: data.organisationId,
      email: data.email,
      cognitoSub: data.cognitoSub,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      locationId: data.locationId,
      profileImageUrl: data.profileImageUrl,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      createdAt: sql`${data.createdAt}::timestamp`,
      updatedAt: sql`${data.updatedAt}::timestamp`,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        organisationId: data.organisationId,
        email: data.email,
        cognitoSub: data.cognitoSub,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        locationId: data.locationId,
        profileImageUrl: data.profileImageUrl,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        updatedAt: sql`${data.updatedAt}::timestamp`,
      },
    });

  logger.info('Super admin seeded in database', {
    id: data.id,
    email: data.email,
    organisationId: data.organisationId,
    role: data.role,
  });
};
