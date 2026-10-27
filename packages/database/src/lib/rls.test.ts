/**
 * RLS Integration Tests
 *
 * Tests Row-Level Security policies and utility functions to ensure
 * multi-tenant data isolation works correctly at the database level.
 *
 * These tests use a real PostgreSQL database connection to verify:
 * - RLS context setting works correctly, and only for its own transaction
 * - Cross-organisation isolation prevents reads in either direction and writes into another organisation
 * - The admin bypass reads across organisations, and only when switched on
 * - Every organisation-scoped table has RLS enabled and forced
 *
 * IMPORTANT: Tests connect as `test_user` which does NOT have BYPASSRLS,
 * so RLS policies are enforced automatically.
 *
 * Seeding and clean-up go through their own `SET LOCAL` helpers, never through
 * the functions under test, so breaking one of those cannot also break the fixtures.
 *
 * @module lib/rls.test
 */

import { randomUUID } from 'crypto';

import { eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client, type Pool } from 'pg';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

import { assessmentFlows, locations, organisations, userAssessments, users } from '../schema';
import {
  asOrganisation,
  connectTestDb,
  deleteOrganisations,
  testDbConnectionConfig,
} from '../testing';

import { setRLSContext, withAdminContext, withRLS } from './rls';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Runs the callback on a brand-new connection that has never carried an RLS setting.
 * Once a connection has run `SET LOCAL app.organisation_id`, the setting reads back
 * as '' rather than NULL, so these cases do not depend on how the policies treat ''.
 */
const onFreshConnection = async <T>(
  callback: (db: NodePgDatabase<Record<string, unknown>>) => Promise<T>
): Promise<T> => {
  const client = new Client(testDbConnectionConfig());
  await client.connect();

  try {
    return await callback(drizzle(client));
  } finally {
    await client.end();
  }
};

/** A pool of exactly one connection, so consecutive queries share a session. */
const onSingleConnectionPool = async <T>(
  callback: (db: NodePgDatabase<Record<string, unknown>>) => Promise<T>
): Promise<T> => {
  const { pool: singlePool, db } = connectTestDb({ poolOptions: { max: 1 } });

  try {
    return await callback(db);
  } finally {
    await singlePool.end();
  }
};

interface RlsSettings {
  organisation: string | null;
  user: string | null;
  admin: string | null;
}

const currentSettings = async <TSchema extends Record<string, unknown>>(
  db: NodePgDatabase<TSchema>
): Promise<RlsSettings> => {
  const result = await db.execute(sql`
    SELECT current_setting('app.organisation_id', true) AS organisation_setting,
           current_setting('app.user_id', true) AS user_setting,
           current_setting('app.is_admin', true) AS admin_setting
  `);
  const row = result.rows[0] as Record<string, string | null>;

  return {
    organisation: row.organisation_setting,
    user: row.user_setting,
    admin: row.admin_setting,
  };
};

describe('RLS Utility Functions', () => {
  let db: NodePgDatabase<Record<string, unknown>>;
  let pool: Pool;

  // Test data IDs
  let orgAId: string;
  let orgBId: string;
  let platformOrgId: string;
  let locationAId: string;
  let locationBId: string;
  let userA1Id: string;
  let userA2Id: string;
  let userB1Id: string;
  let flowId: string;
  let assessmentBId: string;
  let testId: string;

  beforeAll(() => {
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    ({ pool, db } = connectTestDb());
  });

  beforeEach(async () => {
    // Unique per test, so the global unique indexes on email, Cognito sub and account
    // code cannot collide with rows another suite (or a failed clean-up) left behind
    testId = randomUUID().slice(0, 8);

    // Two tenant organisations and a platform organisation, created fresh for each test
    orgAId = randomUUID();
    orgBId = randomUUID();
    platformOrgId = randomUUID();
    userA1Id = randomUUID();
    userA2Id = randomUUID();
    userB1Id = randomUUID();

    await asOrganisation(db, orgAId, async (tx) => {
      await tx.insert(organisations).values({
        id: orgAId,
        type: 'business',
        name: 'Test Organisation A',
        settings: {},
      });

      const [locationA] = await tx
        .insert(locations)
        .values({
          organisationId: orgAId,
          name: 'Location A',
          accountCode: `LOC-A-${testId}`,
          status: 'active',
        })
        .returning();
      locationAId = locationA.id;

      await tx.insert(users).values([
        {
          id: userA1Id,
          organisationId: orgAId,
          locationId: locationAId,
          email: `user-a1-${testId}@test.com`,
          cognitoSub: `cognito-sub-a1-${testId}`,
          firstName: 'Alice',
          lastName: 'Anderson',
          role: 'programme_user',
        },
        {
          id: userA2Id,
          organisationId: orgAId,
          locationId: locationAId,
          email: `user-a2-${testId}@test.com`,
          cognitoSub: `cognito-sub-a2-${testId}`,
          firstName: 'Adam',
          lastName: 'Anderson',
          role: 'customer_admin',
        },
      ]);
    });

    // Assessment flows are shared, so no organisation context is needed
    const [flow] = await db
      .insert(assessmentFlows)
      .values({ name: `RLS write-denial flow ${testId}` })
      .returning();
    flowId = flow.id;

    await asOrganisation(db, orgBId, async (tx) => {
      await tx.insert(organisations).values({
        id: orgBId,
        type: 'individual',
        name: 'Test Organisation B',
        settings: {},
      });

      const [locationB] = await tx
        .insert(locations)
        .values({
          organisationId: orgBId,
          name: 'Location B',
          accountCode: `LOC-B-${testId}`,
          status: 'active',
        })
        .returning();
      locationBId = locationB.id;

      await tx.insert(users).values({
        id: userB1Id,
        organisationId: orgBId,
        locationId: null, // Individual user (no location)
        email: `user-b1-${testId}@test.com`,
        cognitoSub: `cognito-sub-b1-${testId}`,
        firstName: 'Bob',
        lastName: 'Brown',
        role: 'programme_user',
      });

      const [assessmentB] = await tx
        .insert(userAssessments)
        .values({ organisationId: orgBId, userId: userB1Id, flowId })
        .returning();
      assessmentBId = assessmentB.id;
    });

    await asOrganisation(db, platformOrgId, async (tx) => {
      await tx.insert(organisations).values({
        id: platformOrgId,
        type: 'platform',
        name: 'Test Platform Organisation',
        settings: {},
      });
    });
  });

  afterEach(async () => {
    // Only this test's organisations; their locations, users and assessments cascade.
    await deleteOrganisations(db, [orgAId, orgBId, platformOrgId]);
    await db.delete(assessmentFlows).where(eq(assessmentFlows.id, flowId));
  });

  afterAll(async () => {
    await pool.end();
  });

  /** What organisation B holds, read back under B's own context. */
  const organisationBRows = async (): Promise<{
    organisation: string[];
    location: string[];
    user: string[];
    assessment: string[];
  }> =>
    await asOrganisation(db, orgBId, async (tx) => ({
      organisation: (await tx.select().from(organisations).where(eq(organisations.id, orgBId))).map(
        (row) => row.name
      ),
      location: (await tx.select().from(locations).where(eq(locations.id, locationBId))).map(
        (row) => row.name
      ),
      user: (await tx.select().from(users).where(eq(users.id, userB1Id))).map(
        (row) => row.firstName
      ),
      assessment: (
        await tx.select().from(userAssessments).where(eq(userAssessments.id, assessmentBId))
      ).map((row) => row.status),
    }));

  const untouchedOrganisationB = {
    organisation: ['Test Organisation B'],
    location: ['Location B'],
    user: ['Bob'],
    assessment: ['not_started'],
  };

  describe('setRLSContext', () => {
    it('should set RLS context with organisation ID only', async () => {
      await db.transaction(async (tx) => {
        await setRLSContext(tx, orgAId);

        const result = await tx.select().from(users);
        expect(result.map((u) => u.id).sort()).toEqual([userA1Id, userA2Id].sort());
      });
    });

    it('should set RLS context with both organisation ID and user ID', async () => {
      await db.transaction(async (tx) => {
        await setRLSContext(tx, orgAId, userA1Id);

        expect(await currentSettings(tx)).toMatchObject({
          organisation: orgAId,
          user: userA1Id,
        });
        const result = await tx.select().from(users);
        expect(result.map((u) => u.id).sort()).toEqual([userA1Id, userA2Id].sort());
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

  describe('UUID guard', () => {
    const injection = "x'; DROP TABLE users; --";

    it('refuses a non-UUID organisation id before any SQL runs', async () => {
      await db.transaction(async (tx) => {
        const execute = vi.spyOn(tx, 'execute');

        await expect(setRLSContext(tx, injection)).rejects.toThrow(
          'organisationId must be a valid UUID format'
        );
        expect(execute).not.toHaveBeenCalled();
      });
    });

    it('refuses a non-UUID user id before setting it', async () => {
      await db.transaction(async (tx) => {
        const execute = vi.spyOn(tx, 'execute');

        await expect(setRLSContext(tx, orgAId, injection)).rejects.toThrow(
          'userId must be a valid UUID format'
        );
        // Only the organisation SET ran; the user id never reached SQL
        expect(execute).toHaveBeenCalledTimes(1);
      });
    });

    it('withRLS refuses a non-UUID organisation id before opening a transaction', async () => {
      const transaction = vi.spyOn(db, 'transaction');
      const callback = vi.fn();

      try {
        await expect(withRLS(db, injection, undefined, callback)).rejects.toThrow(
          'organisationId must be a valid UUID format'
        );
        await expect(withRLS(db, orgAId, injection, callback)).rejects.toThrow(
          'userId must be a valid UUID format'
        );
        expect(transaction).not.toHaveBeenCalled();
        expect(callback).not.toHaveBeenCalled();
      } finally {
        transaction.mockRestore();
      }
    });
  });

  describe('Context scoping', () => {
    it('clears the organisation and user context when the withRLS transaction ends', async () => {
      await onSingleConnectionPool(async (singleDb) => {
        const inside = await withRLS(singleDb, orgAId, userA1Id, async (tx) => currentSettings(tx));
        expect(inside).toMatchObject({ organisation: orgAId, user: userA1Id });

        // The same pooled connection, outside any transaction
        const after = await currentSettings(singleDb);
        expect(after.organisation ?? '').toBe('');
        expect(after.user ?? '').toBe('');
      });
    });
  });

  describe('withRLS', () => {
    it('should execute callback with user context', async () => {
      const result = await withRLS(db, orgBId, userB1Id, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.map((u) => u.id)).toEqual([userB1Id]);
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
    it('should return the current organisation and the platform organisation, never another tenant', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(organisations);
      });

      const ids = result.map((org) => org.id);
      expect(ids).toContain(orgAId);
      expect(ids).toContain(platformOrgId);
      expect(ids).not.toContain(orgBId);
      // Any other row visible must be a platform organisation (the read policy's exception)
      expect(result.filter((org) => org.id !== orgAId).map((org) => org.type)).toEqual(
        result.filter((org) => org.id !== orgAId).map(() => 'platform')
      );
    });

    it('should not return other organisation data', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(organisations).where(eq(organisations.id, orgBId));
      });

      expect(result).toEqual([]); // Organisation B should not be visible
    });
  });

  describe('Cross-Organisation Isolation - Locations Table', () => {
    it('should only return locations for current organisation', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(locations);
      });

      expect(result.map((location) => location.id)).toEqual([locationAId]);
    });

    it('should not return locations from other organisations', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(locations).where(eq(locations.id, locationBId));
      });

      expect(result).toEqual([]); // Location B should not be visible
    });

    it('should return correct locations for organisation B', async () => {
      const result = await withRLS(db, orgBId, undefined, async (tx) => {
        return await tx.select().from(locations);
      });

      expect(result.map((location) => location.id)).toEqual([locationBId]);
    });
  });

  describe('Cross-Organisation Isolation - Users Table', () => {
    it('should only return users for current organisation', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.map((u) => u.id).sort()).toEqual([userA1Id, userA2Id].sort());
    });

    it('should not return users from other organisations', async () => {
      const result = await withRLS(db, orgAId, undefined, async (tx) => {
        return await tx.select().from(users).where(eq(users.id, userB1Id));
      });

      expect(result).toEqual([]); // User B1 should not be visible
    });

    it('should return correct users for organisation B', async () => {
      const result = await withRLS(db, orgBId, undefined, async (tx) => {
        return await tx.select().from(users);
      });

      expect(result.map((u) => u.id)).toEqual([userB1Id]);
    });
  });

  describe('Cross-Organisation Write Denial', () => {
    it('refuses to insert an organisation other than the current one', async () => {
      await expect(
        withRLS(db, orgAId, undefined, async (tx) => {
          await tx
            .insert(organisations)
            .values({ id: randomUUID(), type: 'business', name: 'Smuggled Organisation' });
        })
      ).rejects.toMatchObject({ cause: { code: '42501' } });
    });

    it('refuses to insert a location into another organisation', async () => {
      await expect(
        withRLS(db, orgAId, undefined, async (tx) => {
          await tx.insert(locations).values({
            organisationId: orgBId,
            name: 'Smuggled Location',
            accountCode: `LOC-X-${testId}`,
            status: 'active',
          });
        })
      ).rejects.toMatchObject({ cause: { code: '42501' } });
    });

    it('refuses to insert a user into another organisation', async () => {
      await expect(
        withRLS(db, orgAId, undefined, async (tx) => {
          await tx.insert(users).values({
            organisationId: orgBId,
            email: `smuggled-${testId}@test.com`,
            cognitoSub: `cognito-sub-smuggled-${testId}`,
            firstName: 'Mallory',
            lastName: 'Smuggled',
            role: 'programme_user',
          });
        })
      ).rejects.toMatchObject({ cause: { code: '42501' } });
    });

    it('refuses to insert an assessment into another organisation', async () => {
      await expect(
        withRLS(db, orgAId, undefined, async (tx) => {
          await tx
            .insert(userAssessments)
            .values({ organisationId: orgBId, userId: userB1Id, flowId });
        })
      ).rejects.toMatchObject({ cause: { code: '42501' } });
    });

    it("updates none of another organisation's rows", async () => {
      const updated = await withRLS(db, orgAId, undefined, async (tx) => ({
        organisation: await tx
          .update(organisations)
          .set({ name: 'Renamed by A' })
          .where(eq(organisations.id, orgBId))
          .returning({ id: organisations.id }),
        location: await tx
          .update(locations)
          .set({ name: 'Renamed by A' })
          .where(eq(locations.id, locationBId))
          .returning({ id: locations.id }),
        user: await tx
          .update(users)
          .set({ firstName: 'Renamed by A' })
          .where(eq(users.id, userB1Id))
          .returning({ id: users.id }),
        assessment: await tx
          .update(userAssessments)
          .set({ status: 'abandoned' })
          .where(eq(userAssessments.id, assessmentBId))
          .returning({ id: userAssessments.id }),
      }));

      expect(updated).toEqual({ organisation: [], location: [], user: [], assessment: [] });
      expect(await organisationBRows()).toEqual(untouchedOrganisationB);
    });

    it("deletes none of another organisation's rows", async () => {
      const deleted = await withRLS(db, orgAId, undefined, async (tx) => ({
        assessment: await tx
          .delete(userAssessments)
          .where(eq(userAssessments.id, assessmentBId))
          .returning({ id: userAssessments.id }),
        user: await tx.delete(users).where(eq(users.id, userB1Id)).returning({ id: users.id }),
        location: await tx
          .delete(locations)
          .where(eq(locations.id, locationBId))
          .returning({ id: locations.id }),
        organisation: await tx
          .delete(organisations)
          .where(eq(organisations.id, orgBId))
          .returning({ id: organisations.id }),
      }));

      expect(deleted).toEqual({ organisation: [], location: [], user: [], assessment: [] });
      expect(await organisationBRows()).toEqual(untouchedOrganisationB);
    });
  });

  describe('Admin bypass', () => {
    it('reads organisations, locations and users across organisations', async () => {
      const seen = await onFreshConnection(async (freshDb) =>
        withAdminContext(freshDb, async (tx) => ({
          organisations: (
            await tx
              .select()
              .from(organisations)
              .where(inArray(organisations.id, [orgAId, orgBId]))
          ).map((row) => row.id),
          locations: (
            await tx
              .select()
              .from(locations)
              .where(inArray(locations.id, [locationAId, locationBId]))
          ).map((row) => row.id),
          users: (
            await tx
              .select()
              .from(users)
              .where(inArray(users.id, [userA1Id, userB1Id]))
          ).map((row) => row.id),
        }))
      );

      expect(seen.organisations.sort()).toEqual([orgAId, orgBId].sort());
      expect(seen.locations.sort()).toEqual([locationAId, locationBId].sort());
      expect(seen.users.sort()).toEqual([userA1Id, userB1Id].sort());
    });

    it('does not read across organisations when the admin flag is unset', async () => {
      const seen = await onFreshConnection(async (freshDb) =>
        withRLS(freshDb, orgAId, undefined, async (tx) => ({
          admin: (await currentSettings(tx)).admin,
          users: (
            await tx
              .select()
              .from(users)
              .where(inArray(users.id, [userA1Id, userB1Id]))
          ).map((row) => row.id),
        }))
      );

      expect(seen.admin ?? '').toBe('');
      expect(seen.users).toEqual([userA1Id]);
    });

    it('does not carry the admin flag past its transaction', async () => {
      await onSingleConnectionPool(async (singleDb) => {
        await withAdminContext(singleDb, async (tx) => tx.select().from(organisations).limit(1));

        // The same pooled connection, outside any transaction
        expect((await currentSettings(singleDb)).admin ?? '').toBe('');

        const visible = await withRLS(singleDb, orgAId, undefined, async (tx) =>
          tx
            .select()
            .from(users)
            .where(inArray(users.id, [userA1Id, userB1Id]))
        );
        expect(visible.map((row) => row.id)).toEqual([userA1Id]);
      });
    });

    // The setting reads back as '' once the connection has carried an organisation context
    it('reads across organisations on a connection that has carried an organisation context', async () => {
      await onSingleConnectionPool(async (singleDb) => {
        await withRLS(singleDb, orgAId, undefined, async (tx) => tx.select().from(users).limit(1));

        const seen = await withAdminContext(singleDb, async (tx) =>
          tx
            .select()
            .from(users)
            .where(inArray(users.id, [userA1Id, userB1Id]))
        );
        expect(seen.map((row) => row.id).sort()).toEqual([userA1Id, userB1Id].sort());
      });
    });
  });

  describe('Queries Without RLS Context', () => {
    it('should return empty results when querying without RLS context', async () => {
      // A connection that has never set app.organisation_id: the setting is NULL,
      // so no organisation-scoped row matches
      const result = await onFreshConnection(async (freshDb) => ({
        users: await freshDb.select().from(users),
        locations: await freshDb.select().from(locations),
      }));

      expect(result).toEqual({ users: [], locations: [] });
    });

    it('returns empty results, not an error, on a connection that has carried an organisation context', async () => {
      const result = await onSingleConnectionPool(async (singleDb) => {
        await withRLS(singleDb, orgAId, undefined, async (tx) => tx.select().from(users).limit(1));

        // The same pooled connection, outside any transaction: the setting is now ''
        return {
          setting: (await currentSettings(singleDb)).organisation,
          users: await singleDb.select().from(users),
          locations: await singleDb.select().from(locations),
        };
      });

      expect(result).toEqual({ setting: '', users: [], locations: [] });
    });

    it('enables and forces RLS on every table with an organisation_id, except process_jobs', async () => {
      const catalogue = await db.execute(sql`
        SELECT c.relname AS table_name,
               c.relrowsecurity AS enabled,
               c.relforcerowsecurity AS forced
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid
          AND a.attname = 'organisation_id'
          AND NOT a.attisdropped
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname
      `);
      const tables = catalogue.rows as {
        table_name: string;
        enabled: boolean;
        forced: boolean;
      }[];

      expect(tables.map((table) => table.table_name)).toContain('users');
      expect(
        tables.filter((table) => !(table.enabled && table.forced)).map((t) => t.table_name)
      ).toEqual(['process_jobs']);
      // RLS-free by design: the job processor claims across organisations
      expect(tables.find((table) => table.table_name === 'process_jobs')).toEqual({
        table_name: 'process_jobs',
        enabled: false,
        forced: false,
      });
    });

    it('reads the organisation setting through NULLIF in every policy that uses it', async () => {
      const catalogue = await db.execute(sql`
        SELECT policyname AS name,
               concat_ws(' ', qual, with_check) AS expression
        FROM pg_policies
        WHERE schemaname = 'public'
          AND concat_ws(' ', qual, with_check) LIKE '%app.organisation_id%'
        ORDER BY policyname
      `);
      const policies = catalogue.rows as { name: string; expression: string }[];
      const casts = (expression: string, pattern: RegExp): number =>
        expression.match(pattern)?.length ?? 0;

      expect(policies.map((policy) => policy.name)).toContain('user_isolation');
      expect(
        policies
          .filter(
            (policy) =>
              casts(policy.expression, /current_setting\('app\.organisation_id'/g) !==
              casts(policy.expression, /NULLIF\(current_setting\('app\.organisation_id'/g)
          )
          .map((policy) => policy.name)
      ).toEqual([]);
    });

    it('enables and forces RLS on the organisations table itself', async () => {
      const catalogue = await db.execute(sql`
        SELECT c.relrowsecurity AS enabled, c.relforcerowsecurity AS forced
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = 'organisations'
      `);

      expect(catalogue.rows).toEqual([{ enabled: true, forced: true }]);
    });
  });
});
