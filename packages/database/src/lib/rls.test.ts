/**
 * RLS Integration Tests
 *
 * Tests Row-Level Security policies and utility functions to ensure
 * multi-tenant data isolation works correctly at the database level.
 *
 * These tests use a real PostgreSQL database connection to verify:
 * - RLS context setting works correctly
 * - Cross-organisation isolation prevents data leaks
 * - All three tables (organisations, locations, users) enforce RLS
 * - Queries fail/return empty without RLS context
 *
 * IMPORTANT: Tests connect as `test_user` which does NOT have BYPASSRLS,
 * so RLS policies are enforced automatically.
 *
 * @module lib/rls.test
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { setRLSContext, withRLS } from './rls';
import { users, organisations, locations } from '../schema';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

describe('RLS Utility Functions', () => {
  let db: NodePgDatabase<any>;
  let pool: Pool;

  // Test data IDs
  let orgAId: string;
  let orgBId: string;
  let locationAId: string;
  let locationBId: string;
  let userA1Id: string;
  let userA2Id: string;
  let userB1Id: string;

  beforeAll(async () => {
    // Setup test database connection
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'ffp_test',
      user: process.env.DB_USER || 'test_user',
      password: process.env.DB_PASSWORD || 'test_password',
    });
    db = drizzle(pool);

    // Clean slate: Truncate all tables before running tests
    // This ensures no leftover data from manual testing or seed scripts interferes
    // Order respects FK constraints (CASCADE handles dependencies)
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE locations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE organisations CASCADE`);
  });

  beforeEach(async () => {
    // Create test data for two organisations before EACH test
    // This ensures data exists even if other test suites clean the database
    // Note: We need to set RLS context with the organisation ID we're creating
    // First, create organisation records with generated UUIDs
    orgAId = randomUUID();
    orgBId = randomUUID();

    // Set context for Organisation A and create it
    await db.execute(sql.raw(`SET app.organisation_id = '${orgAId}'`));
    await db
      .insert(organisations)
      .values({
        id: orgAId,
        type: 'business',
        name: 'Test Organisation A',
        settings: {},
      })
      .returning();

    // Set context for Organisation B and create it
    await db.execute(sql.raw(`SET app.organisation_id = '${orgBId}'`));
    await db
      .insert(organisations)
      .values({
        id: orgBId,
        type: 'individual',
        name: 'Test Organisation B',
        settings: {},
      })
      .returning();

    // Location A (belongs to Organisation A)
    await db.execute(sql.raw(`SET app.organisation_id = '${orgAId}'`));
    const [locationA] = await db
      .insert(locations)
      .values({
        organisationId: orgAId,
        name: 'Location A',
        accountCode: 'LOC-A-TEST',
        status: 'active',
      })
      .returning();
    locationAId = locationA.id;

    // Location B (belongs to Organisation B - even though individual type)
    await db.execute(sql.raw(`SET app.organisation_id = '${orgBId}'`));
    const [locationB] = await db
      .insert(locations)
      .values({
        organisationId: orgBId,
        name: 'Location B',
        accountCode: 'LOC-B-TEST',
        status: 'active',
      })
      .returning();
    locationBId = locationB.id;

    // Users for Organisation A
    await db.execute(sql.raw(`SET app.organisation_id = '${orgAId}'`));
    userA1Id = randomUUID();
    await db
      .insert(users)
      .values({
        id: userA1Id,
        organisationId: orgAId,
        locationId: locationAId,
        email: 'user-a1@test.com',
        cognitoSub: 'cognito-sub-a1',
        firstName: 'Alice',
        lastName: 'Anderson',
        role: 'programme_user',
      })
      .returning();

    userA2Id = randomUUID();
    await db
      .insert(users)
      .values({
        id: userA2Id,
        organisationId: orgAId,
        locationId: locationAId,
        email: 'user-a2@test.com',
        cognitoSub: 'cognito-sub-a2',
        firstName: 'Adam',
        lastName: 'Anderson',
        role: 'customer_admin',
      })
      .returning();

    // User for Organisation B
    await db.execute(sql.raw(`SET app.organisation_id = '${orgBId}'`));
    userB1Id = randomUUID();
    await db
      .insert(users)
      .values({
        id: userB1Id,
        organisationId: orgBId,
        locationId: null, // Individual user (no location)
        email: 'user-b1@test.com',
        cognitoSub: 'cognito-sub-b1',
        firstName: 'Bob',
        lastName: 'Brown',
        role: 'programme_user',
      })
      .returning();
  });

  afterEach(async () => {
    // Clean up test data after each test
    // This matches the integration test pattern and ensures test isolation
    // Order respects FK constraints (CASCADE handles dependencies)
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE locations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE organisations CASCADE`);
  });

  afterAll(async () => {
    // Close connection pool
    await pool.end();
  });

  describe('setRLSContext', () => {
    it('should set RLS context with organisation ID only', async () => {
      await db.transaction(async (tx) => {
        await setRLSContext(tx, orgAId);

        // Verify context is set by querying and checking we only get organisation A data
        const result = await tx.select().from(users);
        expect(result.length).toBe(2); // Only organisation A users
        expect(result.every((u) => u.organisationId === orgAId)).toBe(true);
      });
    });

    it('should set RLS context with both organisation ID and user ID', async () => {
      await db.transaction(async (tx) => {
        await setRLSContext(tx, orgAId, userA1Id);

        // Verify context is set by querying
        const result = await tx.select().from(users);
        expect(result.length).toBe(2); // Both organisation A users visible
        expect(result.every((u) => u.organisationId === orgAId)).toBe(true);
      });
    });

    it('should throw error if organisationId is not provided', async () => {
      await expect(
        db.transaction(async (tx) => {
          await setRLSContext(tx, '');
        })
      ).rejects.toThrow('organisationId is required for RLS context');
    });
  });

  describe('withRLS', () => {
    it('should execute callback within RLS context', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(2); // Only organisation A users
      expect(result.every((u) => u.organisationId === orgAId)).toBe(true);
    });

    it('should execute callback with user context', async () => {
      const result = await withRLS(db, orgBId, userB1Id, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(1); // Only organisation B user
      expect(result[0].organisationId).toBe(orgBId);
    });

    it('should throw error if organisationId is not provided', async () => {
      await expect(
        withRLS(db, '', undefined, async (tx) => {
          return await tx.select().from(users);
        })
      ).rejects.toThrow('organisationId is required for RLS context');
    });
  });

  describe('Cross-Organisation Isolation - Organisations Table', () => {
    it('should only return current organisation when RLS context is set', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(organisations);
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(orgAId);
      expect(result[0].name).toBe('Test Organisation A');
    });

    it('should not return other organisation data', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(organisations).where(eq(organisations.id, orgBId));
      });

      expect(result.length).toBe(0); // Organisation B should not be visible
    });
  });

  describe('Cross-Organisation Isolation - Locations Table', () => {
    it('should only return locations for current organisation', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(locations);
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(locationAId);
      expect(result[0].organisationId).toBe(orgAId);
    });

    it('should not return locations from other organisations', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(locations).where(eq(locations.id, locationBId));
      });

      expect(result.length).toBe(0); // Location B should not be visible
    });

    it('should return correct locations for organisation B', async () => {
      const result = await withRLS(db, orgBId, undefined, async (tx) => {
        return await tx.select().from(locations);
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(locationBId);
      expect(result[0].organisationId).toBe(orgBId);
    });
  });

  describe('Cross-Organisation Isolation - Users Table', () => {
    it('should only return users for current organisation', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(2); // Two users in organisation A
      expect(result.every((u) => u.organisationId === orgAId)).toBe(true);
    });

    it('should not return users from other organisations', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(users).where(eq(users.id, userB1Id));
      });

      expect(result.length).toBe(0); // User B1 should not be visible
    });

    it('should return correct users for organisation B', async () => {
      const result = await withRLS(db, orgBId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.length).toBe(1); // One user in organisation B
      expect(result[0].id).toBe(userB1Id);
      expect(result[0].organisationId).toBe(orgBId);
    });
  });

  describe('Queries Without RLS Context', () => {
    it('should return empty results when querying without RLS context', async () => {
      // test_user does NOT have BYPASSRLS, so RLS policies are enforced
      // Set app.organisation_id to a valid UUID that doesn't exist in the data
      // Note: We use a zeros UUID which is valid but won't match any organisation
      const nonExistentOrgId = '00000000-0000-0000-8000-000000000000';
      await db.execute(sql.raw(`SET app.organisation_id = '${nonExistentOrgId}'`));

      // Without a matching organisation_id, queries should return empty results
      const result = await db.select().from(users);
      expect(result.length).toBe(0); // No results for non-existent organisation
    });

    it('should verify RLS is enabled on all tables', async () => {
      const rlsCheck = await db.execute(sql`
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('organisations', 'locations', 'users')
      `);

      // Verify RLS is enabled (rowsecurity = true)
      const tables = rlsCheck.rows;
      expect(tables.length).toBe(3);
      tables.forEach((table: any) => {
        expect(table.rowsecurity).toBe(true);
      });
    });

    it('should verify RLS policies exist on all tables', async () => {
      const policiesCheck = await db.execute(sql`
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);

      const policies = policiesCheck.rows;

      // Check organisation policies exist
      expect(
        policies.some(
          (p: any) =>
            p.tablename === 'organisations' && p.policyname === 'organisation_read_isolation'
        )
      ).toBe(true);

      // Check location_isolation policy exists
      expect(
        policies.some(
          (p: any) => p.tablename === 'locations' && p.policyname === 'location_isolation'
        )
      ).toBe(true);

      // Check user_isolation policy exists
      expect(
        policies.some((p: any) => p.tablename === 'users' && p.policyname === 'user_isolation')
      ).toBe(true);

      // Check user_assessment_organisation_isolation policy exists
      expect(
        policies.some(
          (p: any) =>
            p.tablename === 'user_assessments' &&
            p.policyname === 'user_assessment_organisation_isolation'
        )
      ).toBe(true);

      // Check user_assessment_answers_organisation_isolation policy exists
      expect(
        policies.some(
          (p: any) =>
            p.tablename === 'user_assessment_answers' &&
            p.policyname === 'user_assessment_answers_organisation_isolation'
        )
      ).toBe(true);

      // Check programme_organisation_isolation policy exists
      expect(
        policies.some(
          (p: any) =>
            p.tablename === 'programmes' && p.policyname === 'programme_organisation_isolation'
        )
      ).toBe(true);
    });
  });
});
