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

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getDb, closeDb } from '../src/client';
import { users, organisations, locations } from '../src/schema';
import { withRLS } from '../src/lib/rls';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

describe('Drizzle Integration Tests', () => {
  let db: ReturnType<typeof getDb>;

  beforeAll(async () => {
    // Setup test database connection
    // IMPORTANT: test_user does NOT have BYPASSRLS, so RLS policies are enforced
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USER = 'test_user';
    process.env.DB_PASSWORD = 'test_password';
    process.env.DB_SSL = 'false';

    db = getDb();

    // Clean slate: Truncate all tables before running test suite
    // This ensures no leftover data from manual testing or seed scripts interferes
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE locations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE organisations CASCADE`);
  });

  afterAll(async () => {
    // Cleanup: Close connection pool
    await closeDb();
  });

  beforeEach(async () => {
    // Clean tables before each test
    // Note: RLS will prevent deletion without context, so we use raw SQL
    // Order respects FK constraints (CASCADE handles dependencies)
    await db.execute(sql`TRUNCATE TABLE user_assessments CASCADE`);
    await db.execute(sql`TRUNCATE TABLE users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE locations CASCADE`);
    await db.execute(sql`TRUNCATE TABLE assessment_flows CASCADE`);
    await db.execute(sql`TRUNCATE TABLE process_jobs CASCADE`);
    await db.execute(sql`TRUNCATE TABLE organisations CASCADE`);
  });

  describe('Database Constraints', () => {
    it('should enforce foreign key constraints', async () => {
      const invalidOrgId = randomUUID();
      const userId = randomUUID();

      // Try to create user without valid organisation (should fail)
      await expect(async () => {
        // Note: We still need to set RLS context, but the FK will fail
        await withRLS(db, invalidOrgId, undefined, async (tx) => {
          await tx.insert(users).values({
            id: userId,
            organisationId: invalidOrgId, // Non-existent organisation
            email: 'test@example.com',
            cognitoSub: 'cognito-123',
            firstName: 'John',
            lastName: 'Doe',
            role: 'programme_user',
          });
        });
      }).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const orgId = randomUUID();

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
          email: 'duplicate@test.com',
          cognitoSub: 'cognito-1',
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
            email: 'duplicate@test.com', // Duplicate
            cognitoSub: 'cognito-2',
            firstName: 'User',
            lastName: 'Two',
            role: 'programme_user',
          });
        });
      }).rejects.toThrow();
    });

    it('should enforce unique account code constraint', async () => {
      const orgId = randomUUID();

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
          accountCode: 'DUPLICATE',
          status: 'active',
        });
      });

      // Try to create second location with same account code (should fail)
      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          await tx.insert(locations).values({
            organisationId: orgId,
            name: 'Location Two',
            accountCode: 'DUPLICATE', // Duplicate
            status: 'active',
          });
        });
      }).rejects.toThrow();
    });

    it('should cascade delete when organisation is deleted', async () => {
      const orgId = randomUUID();
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
          email: 'cascade@test.com',
          cognitoSub: 'cognito-cascade',
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
      const orgId = randomUUID();

      await expect(async () => {
        await withRLS(db, orgId, undefined, async (tx) => {
          // Create organisation
          await tx.insert(organisations).values({
            id: orgId,
            type: 'individual',
            name: 'Rollback Test',
          });

          // Force an error (invalid FK - different organisation)
          await tx.insert(users).values({
            id: randomUUID(),
            organisationId: randomUUID(), // Invalid FK - different organisation
            email: 'rollback@test.com',
            cognitoSub: 'cognito-fail',
            firstName: 'Fail',
            lastName: 'User',
            role: 'programme_user',
          });
        });
      }).rejects.toThrow();

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
