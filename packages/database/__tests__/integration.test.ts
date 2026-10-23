/**
 * Drizzle ORM Integration Tests
 *
 * Tests actual database operations against a real PostgreSQL instance.
 * Requires a test database to be set up and migrated.
 *
 * Setup:
 * 1. Create test database: psql -h localhost -d postgres -c "CREATE DATABASE ffp_test;"
 * 2. Run migrations: DB_NAME=ffp_test pnpm db:migrate
 * 3. Run tests: pnpm test
 *
 * IMPORTANT: Tests connect as `test_user` which does NOT have BYPASSRLS,
 * so RLS policies are enforced automatically.
 *
 * @module __tests__/integration.test
 */

import { randomUUID } from 'crypto';

import { eq } from 'drizzle-orm';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';

import { getDb, closeDb } from '../src/client';
import { withRLS } from '../src/lib/rls';
import { users, organisations, locations } from '../src/schema';

import { deleteOrganisations } from './helpers/rls-context';

// Unique per run, so the global unique indexes on email and account code
// cannot collide with rows another suite holds.
const RUN_ID = randomUUID().slice(0, 8);

describe('Drizzle Integration Tests', () => {
  let db: ReturnType<typeof getDb>;
  let createdOrganisationIds: string[] = [];

  /** A fresh organisation id, deleted (with everything under it) after the test. */
  const newOrganisationId = (): string => {
    const organisationId = randomUUID();
    createdOrganisationIds.push(organisationId);

    return organisationId;
  };

  beforeAll(() => {
    // Setup test database connection
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASSWORD = 'test_password';
    process.env.DB_SSL = 'false';

    db = getDb();
  });

  afterAll(async () => {
    // Cleanup: Close connection pool
    await closeDb();
  });

  afterEach(async () => {
    await deleteOrganisations(db, createdOrganisationIds);
    createdOrganisationIds = [];
  });

  describe('Database Constraints', () => {
    it('should enforce foreign key constraints', async () => {
      const invalidOrgId = randomUUID(); // never inserted
      const userId = randomUUID();

      // Under the missing organisation's own context the policy admits the row, so the FK refuses it
      await expect(async () => {
        await withRLS(db, invalidOrgId, undefined, async (tx) => {
          await tx.insert(users).values({
            id: userId,
            organisationId: invalidOrgId, // Non-existent organisation
            email: `fk-${RUN_ID}@test.com`,
            cognitoSub: `cognito-fk-${RUN_ID}`,
            firstName: 'John',
            lastName: 'Doe',
            role: 'programme_user',
          });
        });
      }).rejects.toMatchObject({
        cause: { code: '23503', constraint: 'users_organisation_id_organisations_id_fk' },
      });
    });

    it('should enforce unique email constraint', async () => {
      const orgId = newOrganisationId();
      const email = `duplicate-${RUN_ID}@test.com`;

      // Create organisation and first user
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'individual',
          name: 'Test Organisation',
        });

        await tx.insert(users).values({
          id: randomUUID(),
          organisationId: orgId,
          email,
          cognitoSub: `cognito-1-${RUN_ID}`,
          firstName: 'User',
          lastName: 'One',
          role: 'programme_user',
        });
      });

      // Try to create second user with same email (should fail)
      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          await tx.insert(users).values({
            id: randomUUID(),
            organisationId: orgId,
            email, // Duplicate
            cognitoSub: `cognito-2-${RUN_ID}`,
            firstName: 'User',
            lastName: 'Two',
            role: 'programme_user',
          });
        });
      }).rejects.toMatchObject({ cause: { code: '23505', constraint: 'users_email_unique' } });
    });

    it('should enforce unique account code constraint', async () => {
      const orgId = newOrganisationId();
      const accountCode = `DUP-${RUN_ID}`;

      // Create organisation and first location
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'business',
          name: 'Test Organisation',
        });

        await tx.insert(locations).values({
          organisationId: orgId,
          name: 'Location One',
          accountCode,
          status: 'active',
        });
      });

      // Try to create second location with same account code (should fail)
      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          await tx.insert(locations).values({
            organisationId: orgId,
            name: 'Location Two',
            accountCode, // Duplicate
            status: 'active',
          });
        });
      }).rejects.toMatchObject({
        cause: { code: '23505', constraint: 'locations_account_code_unique' },
      });
    });

    it('should cascade delete when organisation is deleted', async () => {
      const orgId = newOrganisationId();
      const userId = randomUUID();

      // Create organisation and user
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.insert(organisations).values({
          id: orgId,
          type: 'individual',
          name: 'Test Organisation',
        });

        await tx.insert(users).values({
          id: userId,
          organisationId: orgId,
          email: `cascade-${RUN_ID}@test.com`,
          cognitoSub: `cognito-cascade-${RUN_ID}`,
          firstName: 'Cascade',
          lastName: 'Test',
          role: 'programme_user',
        });
      });

      // Delete organisation (should cascade to user)
      await withRLS(db, orgId, undefined, async (tx) => {
        await tx.delete(organisations).where(eq(organisations.id, orgId));
      });

      // Verify user was also deleted via cascade
      // Set RLS context to the deleted org's ID so the UUID cast succeeds;
      // since the data was cascade-deleted, we expect no rows returned.
      const userCheckResult = await withRLS(db, orgId, undefined, async (tx) => {
        return await tx.select().from(users).where(eq(users.id, userId));
      });

      expect(userCheckResult).toHaveLength(0);
    });
  });

  describe('Transactions', () => {
    it('should rollback transaction on error', async () => {
      const orgId = newOrganisationId();

      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          // Create organisation
          await tx.insert(organisations).values({
            id: orgId,
            type: 'individual',
            name: 'Rollback Test',
          });

          // Force an error: a user in another organisation, which the insert policy refuses
          await tx.insert(users).values({
            id: randomUUID(),
            organisationId: randomUUID(), // Not the context's organisation
            email: `rollback-${RUN_ID}@test.com`,
            cognitoSub: `cognito-fail-${RUN_ID}`,
            firstName: 'Fail',
            lastName: 'User',
            role: 'programme_user',
          });
        });
      }).rejects.toMatchObject({
        cause: {
          code: '42501',
          message: 'new row violates row-level security policy for table "users"',
        },
      });

      // Verify organisation was NOT created (transaction rolled back)
      // Set RLS context to the rolled-back org's ID so the UUID cast succeeds;
      // since the transaction was rolled back, we expect no rows returned.
      const orgCheckResult = await withRLS(db, orgId, undefined, async (tx) => {
        return await tx.select().from(organisations).where(eq(organisations.id, orgId));
      });

      expect(orgCheckResult).toHaveLength(0);
    });
  });
});
